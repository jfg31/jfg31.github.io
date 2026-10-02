import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, mkdir, writeFile, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { exportAll } from '../scripts/export.mjs';

const sections = (title) => `
## Versión pública (ES)
### Título
${title} ES
### Resumen
r
### Problema
p
### Solución
s
### Resultado
o

## Public version (EN)
### Title
${title} EN
### Summary
r
### Problem
p
### Solution
s
### Outcome
o
`;

const caseFile = (slug, publico = true) =>
  `---\nslug: ${slug}\npublico: ${publico}\ndestacado: 2\ncategoria: producto\nstack: [Astro]\nperiodo: 2026-01 → presente\nestado: activo\nactualizado: 2026-10-01\n---\n# X\n${sections(slug)}`;

const profileFile = `---\nnombre: Jose Flores\nemail: jfloresgandara31@gmail.com\ngithub: jfg31\nlinkedin: ""\nactualizado: 2026-10-01\n---\n
## Versión pública (ES)
### Titular
t
### Sobre mí
a
### Educación
e
### Experiencia
x
### Certificaciones
c
### Hardware
h

## Public version (EN)
### Headline
t
### About
a
### Education
e
### Experience
x
### Certifications
c
### Hardware
h
`;

let root;
let portfolioDir;
let outDir;

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), 'portfolio-'));
  portfolioDir = join(root, 'Portfolio');
  outDir = join(root, 'content');
  await mkdir(join(portfolioDir, 'Casos'), { recursive: true });
  await writeFile(join(portfolioDir, 'Perfil.md'), profileFile);
});

afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

describe('exportAll', () => {
  it('exporta solo casos públicos y el perfil', async () => {
    await writeFile(join(portfolioDir, 'Casos', 'Uno.md'), caseFile('uno'));
    await writeFile(join(portfolioDir, 'Casos', 'Privado.md'), caseFile('privado', false));
    const result = await exportAll({ portfolioDir, outDir });
    expect(result).toEqual({ cases: 1, skipped: 1 });
    expect(await readdir(join(outDir, 'cases'))).toEqual(['uno.json']);
    const uno = JSON.parse(await readFile(join(outDir, 'cases', 'uno.json'), 'utf8'));
    expect(uno.text.en.title).toBe('uno EN');
    const profile = JSON.parse(await readFile(join(outDir, 'profile.json'), 'utf8'));
    expect(profile.github).toBe('jfg31');
  });

  it('borra JSON obsoletos de casos que ya no son públicos', async () => {
    await mkdir(join(outDir, 'cases'), { recursive: true });
    await writeFile(join(outDir, 'cases', 'viejo.json'), '{}');
    await writeFile(join(portfolioDir, 'Casos', 'Uno.md'), caseFile('uno'));
    await exportAll({ portfolioDir, outDir });
    expect(await readdir(join(outDir, 'cases'))).toEqual(['uno.json']);
  });

  it('lanza con slugs duplicados', async () => {
    await writeFile(join(portfolioDir, 'Casos', 'A.md'), caseFile('igual'));
    await writeFile(join(portfolioDir, 'Casos', 'B.md'), caseFile('igual'));
    await expect(exportAll({ portfolioDir, outDir })).rejects.toThrow('slug duplicado: igual');
  });

  it('ignora archivos que no son .md', async () => {
    await writeFile(join(portfolioDir, 'Casos', 'Uno.md'), caseFile('uno'));
    await writeFile(join(portfolioDir, 'Casos', 'foto.png'), 'x');
    const result = await exportAll({ portfolioDir, outDir });
    expect(result.cases).toBe(1);
  });
});
