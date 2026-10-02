import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, mkdir, writeFile, rm, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { execSync } from 'node:child_process';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const projectRoot = resolve(__dirname, '..');
const cliPath = resolve(projectRoot, 'scripts', 'lib', 'cli.mjs');

let testDir;
let scriptPath;

beforeEach(async () => {
  testDir = await mkdtemp(join(tmpdir(), 'cli-test-'));
  scriptPath = join(testDir, 'test-main.mjs');

  const cliFileUrl = pathToFileURL(cliPath).href;
  const scriptCode = `import { isMain } from '${cliFileUrl}';
console.log(isMain(import.meta.url) ? 'MAIN' : 'NOT_MAIN');
`;

  await writeFile(scriptPath, scriptCode, 'utf8');
});

afterEach(async () => {
  await rm(testDir, { recursive: true, force: true });
});

describe('isMain', () => {
  it('returns true when run directly via real path', () => {
    const output = execSync(`node "${scriptPath}"`, { encoding: 'utf8' }).trim();
    expect(output).toBe('MAIN');
  });

  it('returns false when module is imported but not main', async () => {
    const cliFileUrl = pathToFileURL(cliPath).href;
    const importedCode = `import { isMain } from '${cliFileUrl}';
export default isMain(import.meta.url);
`;
    const importerPath = join(testDir, 'importer.mjs');
    const importedPath = join(testDir, 'imported.mjs');

    await writeFile(importedPath, importedCode, 'utf8');
    await writeFile(importerPath, `
import('./imported.mjs').then(m => {
  console.log(m.default ? 'MAIN' : 'NOT_MAIN');
}).catch(e => console.error(e));
`, 'utf8');

    const output = execSync(`node "${importerPath}"`, { encoding: 'utf8' }).trim();
    expect(output).toBe('NOT_MAIN');
  });

  it('returns true when run via junction path (not symlink)', async () => {
    const realDir = join(testDir, 'real-dir');
    const junctionDir = join(testDir, 'junction-dir');
    const scriptInDir = join(realDir, 'script.mjs');

    await mkdir(realDir, { recursive: true });

    const cliFileUrl = pathToFileURL(cliPath).href;
    const scriptCode = `import { isMain } from '${cliFileUrl}';
console.log(isMain(import.meta.url) ? 'MAIN' : 'NOT_MAIN');
`;

    await writeFile(scriptInDir, scriptCode, 'utf8');
    await symlink(realDir, junctionDir, 'junction');

    const output = execSync(`node "${join(junctionDir, 'script.mjs')}"`, { encoding: 'utf8' }).trim();
    expect(output).toBe('MAIN');
  });
});
