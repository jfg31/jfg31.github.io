import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { listRepoFiles, lintFiles } from '../scripts/privacy-lint.mjs';
import { assertBlocklistUsable } from '../scripts/lib/privacy.mjs';

// Strings sensibles construidos dinámicamente para que el linter no marque este archivo.
const privateIp = ['192', '168', '1', '10'].join('.');
const git = (cwd, ...args) => execFileSync('git', args, { cwd, stdio: 'pipe' });

let root;
beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), 'privacy-'));
  git(root, 'init', '-q');
  git(root, 'config', 'user.email', ['test', 'example.com'].join('@'));
  git(root, 'config', 'user.name', 'test');
  git(root, 'config', 'core.quotePath', 'true');
});
afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

describe('listRepoFiles / lintFiles', () => {
  it('detecta violaciones en archivos con nombre no ASCII', async () => {
    await writeFile(join(root, 'Educación.md'), `servidor ${privateIp}`);
    await writeFile(join(root, 'plain.md'), `servidor ${privateIp}`);
    const files = listRepoFiles(root);
    expect(files.sort()).toEqual(['Educación.md', 'plain.md']);
    const results = await lintFiles(root, files, []);
    expect(results.map((r) => r.file).sort()).toEqual(['Educación.md', 'plain.md']);
    expect(results.every((r) => r.rule === 'ip-privada')).toBe(true);
  });

  it('omite sin error un archivo versionado borrado del working tree', async () => {
    await writeFile(join(root, 'gone.md'), 'texto');
    git(root, 'add', 'gone.md');
    git(root, 'commit', '-q', '-m', 'x');
    await rm(join(root, 'gone.md'));
    const files = listRepoFiles(root);
    expect(files).toContain('gone.md');
    await expect(lintFiles(root, files, [])).resolves.toEqual([]);
  });

  it('propaga errores de lectura que no sean ENOENT', async () => {
    const { mkdir } = await import('node:fs/promises');
    await mkdir(join(root, 'carpeta.md'));
    await expect(lintFiles(root, ['carpeta.md'], [])).rejects.toThrow();
  });

  it('no escanea archivos ignorados', async () => {
    await writeFile(join(root, '.gitignore'), 'secreto.md\n');
    await writeFile(join(root, 'secreto.md'), `servidor ${privateIp}`);
    const files = listRepoFiles(root);
    expect(files).not.toContain('secreto.md');
    expect(await lintFiles(root, files, [])).toEqual([]);
  });

  it('aplica la lista de bloqueo a los archivos', async () => {
    await writeFile(join(root, 'nota.md'), 'Hablé con Persona Ficticia');
    const results = await lintFiles(root, listRepoFiles(root), ['persona ficticia']);
    expect(results).toEqual([{ file: 'nota.md', rule: 'lista-de-bloqueo', match: 'persona ficticia' }]);
  });
});

describe('assertBlocklistUsable', () => {
  it('lanza si la lista está vacía y menciona la ruta', () => {
    expect(() => assertBlocklistUsable([], 'ruta/lista.md')).toThrow(/ruta\/lista\.md/);
  });

  it('no lanza si hay términos', () => {
    expect(() => assertBlocklistUsable(['algo'], 'ruta/lista.md')).not.toThrow();
  });
});
