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

const locale = ({ section, h, extra = '' }) => `
## ${section}
### ${h.title} [ia]
AI Engineer ${section}
### ${h.title} [fullstack]
Full-Stack Developer ${section}
### ${h.summary} [ia]
Summary ai.
### ${h.summary} [fullstack]
Summary fullstack.
### ${h.skills}
- [ia] **Grupo A:** n8n, Ollama
- [ia, fullstack] **Grupo B:** Python, TypeScript
- [fullstack] **Grupo C:** Astro, React
- [ia, fullstack] **Grupo D:** Docker, Git
### ${h.experience}
Developer | Helvetia del Caribe | 2021 – presente
- [ia, fullstack] Bullet uno.
- [ia] Bullet dos ia.
- [fullstack] Bullet dos fs.
- [ia, fullstack] Bullet tres.
### ${h.projects}
- [ia] **Uno** (uno) — Proyecto uno.
- [ia, fullstack] **Dos** (uno) — Proyecto dos.
- [fullstack] **Tres** (uno) — Proyecto tres.
### ${h.education}
B.S. Computer Science | UPRB | 2021
### ${h.certifications}
Microsoft Office Specialist: Excel | Microsoft | 2020
${extra}`;

const ES = { section: 'Versión pública (ES)', h: { title: 'Título', summary: 'Resumen', skills: 'Habilidades', experience: 'Experiencia', projects: 'Proyectos', education: 'Educación', certifications: 'Certificaciones' } };
const EN = { section: 'Public version (EN)', h: { title: 'Title', summary: 'Summary', skills: 'Skills', experience: 'Experience', projects: 'Projects', education: 'Education', certifications: 'Certifications' } };

const resumeFile = ({ es = locale(ES), en = locale(EN) } = {}) =>
  `---\nactualizado: 2026-10-06\n---\n# Resume\n## Privado\n- Teléfono: (787) 555-0199\n- Ciudad: Bayamón\n\n${es}\n${en}`;

let root;
let portfolioDir;
let outDir;

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), 'portfolio-'));
  portfolioDir = join(root, 'Portfolio');
  outDir = join(root, 'content');
  await mkdir(join(portfolioDir, 'Casos'), { recursive: true });
  await writeFile(join(portfolioDir, 'Perfil.md'), profileFile);
  await writeFile(join(portfolioDir, 'Resume.md'), resumeFile());
});

afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

describe('exportAll', () => {
  it('exporta solo casos públicos y el perfil', async () => {
    await writeFile(join(portfolioDir, 'Casos', 'Uno.md'), caseFile('uno'));
    await writeFile(join(portfolioDir, 'Casos', 'Privado.md'), caseFile('privado', false));
    const result = await exportAll({ portfolioDir, outDir });
    expect(result).toEqual({ cases: 1, skipped: 1, resume: true });
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

  it('escribe content/resume.json sin la sección privada', async () => {
    await writeFile(join(portfolioDir, 'Casos', 'Uno.md'), caseFile('uno'));
    await exportAll({ portfolioDir, outDir });
    const raw = await readFile(join(outDir, 'resume.json'), 'utf8');
    const resume = JSON.parse(raw);
    expect(Object.keys(resume.variants)).toEqual(['ai', 'fullstack']);
    expect(raw).not.toContain('555-0199');
  });

  it('falla si falta Resume.md', async () => {
    await writeFile(join(portfolioDir, 'Casos', 'Uno.md'), caseFile('uno'));
    await rm(join(portfolioDir, 'Resume.md'));
    await expect(exportAll({ portfolioDir, outDir })).rejects.toThrow(/Resume\.md no existe/);
  });

  it('falla si un proyecto del resume apunta a un caso privado', async () => {
    await writeFile(join(portfolioDir, 'Casos', 'Uno.md'), caseFile('uno'));
    await writeFile(join(portfolioDir, 'Casos', 'secreto.md'), caseFile('secreto', false));
    const md = (await readFile(join(portfolioDir, 'Resume.md'), 'utf8')).replaceAll('(uno)', '(secreto)');
    await writeFile(join(portfolioDir, 'Resume.md'), md);
    await expect(exportAll({ portfolioDir, outDir })).rejects.toThrow(/«secreto» no existe o no es público/);
  });
});
