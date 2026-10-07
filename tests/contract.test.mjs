import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { checkContract } from '../scripts/check-contract.mjs';
import { RESUME_VARIANTS, resumeFileBase, resumePath, variantSlug } from '../scripts/lib/resume-meta.mjs';

let root;
let distDir;
let contentDir;

const indexLinks = (...slugs) => (l) => slugs.map((s) => `<a href="/${l}/projects/${s}/">x</a>`).join('');

const page = async (rel, html = '<html></html>') => {
  await mkdir(join(distDir, rel), { recursive: true });
  await writeFile(join(distDir, rel, 'index.html'), html);
};

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), 'contract-'));
  distDir = join(root, 'dist');
  contentDir = join(root, 'content');
  await mkdir(join(contentDir, 'cases'), { recursive: true });
  await writeFile(
    join(contentDir, 'cases', 'uno.json'),
    JSON.stringify({ slug: 'uno', text: { en: { title: 'Jira & Telegram' }, es: { title: 'Jira y Telegram' } } }),
  );
  await writeFile(join(contentDir, 'profile.json'), JSON.stringify({ name: 'Jose Flores' }));
  const variants = {};
  for (const v of RESUME_VARIANTS) {
    variants[v] = {};
    for (const l of ['en', 'es']) variants[v][l] = { title: v === 'ai' && l === 'en' ? 'A & B' : `Title ${v} ${l}` };
  }
  await writeFile(join(contentDir, 'resume.json'), JSON.stringify({ variants }));
  await mkdir(join(distDir, 'resume'), { recursive: true });
  for (const l of ['en', 'es']) {
    await page(l);
    await page(`${l}/projects`, indexLinks('uno')(l));
    await page(`${l}/about`, RESUME_VARIANTS.map((v) => `<a href="${resumePath(l, v)}">x</a>`).join(''));
    for (const v of RESUME_VARIANTS) {
      const base = resumeFileBase('Jose Flores', v, l);
      const title = variants[v][l].title.replace(/&/g, '&amp;');
      await page(
        `${l}/resume/${variantSlug(l, v)}`,
        `<h1>${title}</h1><a href="/resume/${base}.pdf">pdf</a><a href="/resume/${base}.docx">docx</a>`,
      );
      for (const ext of ['pdf', 'docx']) await writeFile(join(distDir, 'resume', `${base}.${ext}`), 'x');
    }
  }
});

afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

describe('checkContract', () => {
  it('pasa cuando todas las páginas existen con su título (aceptando HTML escapado)', async () => {
    await page('en/projects/uno', '<h1>Jira &amp; Telegram</h1>');
    await page('es/projects/uno', '<h1>Jira y Telegram</h1>');
    expect(await checkContract({ distDir, contentDir })).toEqual([]);
  });

  it('reporta páginas de caso faltantes', async () => {
    await page('en/projects/uno', '<h1>Jira &amp; Telegram</h1>');
    expect(await checkContract({ distDir, contentDir })).toEqual(['falta es/projects/uno/index.html']);
  });

  it('reporta títulos ausentes', async () => {
    await page('en/projects/uno', '<h1>Otro</h1>');
    await page('es/projects/uno', '<h1>Jira y Telegram</h1>');
    expect(await checkContract({ distDir, contentDir })).toEqual(['en/projects/uno: no aparece el título "Jira & Telegram"']);
  });

  it('no cuenta el título si solo aparece en <head> (<title>)', async () => {
    await page('en/projects/uno', '<html><head><title>Jira &amp; Telegram</title></head><body><h1>Otro</h1></body></html>');
    await page('es/projects/uno', '<h1>Jira y Telegram</h1>');
    expect(await checkContract({ distDir, contentDir })).toEqual(['en/projects/uno: no aparece el título "Jira & Telegram"']);
  });

  it('acepta el título en el <body> aunque <head> exista', async () => {
    await page('en/projects/uno', '<html><head><title>x</title></head><body><h1>Jira &amp; Telegram</h1></body></html>');
    await page('es/projects/uno', '<h1>Jira y Telegram</h1>');
    expect(await checkContract({ distDir, contentDir })).toEqual([]);
  });

  it('reporta casos sin enlace en el índice de proyectos', async () => {
    await page('en/projects/uno', '<h1>Jira &amp; Telegram</h1>');
    await page('es/projects/uno', '<h1>Jira y Telegram</h1>');
    await page('es/projects', '<a href="/es/projects/otro/">x</a>');
    expect(await checkContract({ distDir, contentDir })).toEqual(['es/projects/index.html: no enlaza al caso "uno"']);
  });

  it('reporta páginas generales faltantes', async () => {
    await rm(join(distDir, 'es', 'about'), { recursive: true });
    await page('en/projects/uno', 'Jira &amp; Telegram');
    await page('es/projects/uno', 'Jira y Telegram');
    expect(await checkContract({ distDir, contentDir })).toEqual(['falta es/about/index.html']);
  });

  it('reporta gracefully si content/cases falta', async () => {
    await rm(join(contentDir, 'cases'), { recursive: true });
    await page('en/projects/uno', 'test');
    const problems = await checkContract({ distDir, contentDir });
    expect(problems).toHaveLength(1);
    expect(problems[0]).toContain('falta');
    expect(problems[0]).toMatch(/content.*cases/);
    expect(problems[0]).toContain('pnpm export');
  });

  it('pasa con el resume completo', async () => {
    await page('en/projects/uno', '<h1>Jira &amp; Telegram</h1>');
    await page('es/projects/uno', '<h1>Jira y Telegram</h1>');
    expect(await checkContract({ distDir, contentDir })).toEqual([]);
  });

  it('reporta página de resume, descarga y enlace desde Sobre mí faltantes', async () => {
    await page('en/projects/uno', '<h1>Jira &amp; Telegram</h1>');
    await page('es/projects/uno', '<h1>Jira y Telegram</h1>');
    await rm(join(distDir, 'es/resume/ia'), { recursive: true });
    await rm(join(distDir, 'resume', 'JoseFlores-Resume-FullStack-EN.docx'));
    await page('en/about', `<a href="${resumePath('en', 'ai')}">x</a>`);
    expect(await checkContract({ distDir, contentDir })).toEqual([
      'falta resume/JoseFlores-Resume-FullStack-EN.docx',
      'en/about/index.html: no enlaza /en/resume/fullstack/',
      'falta es/resume/ia/index.html',
    ]);
  });

  it('reporta si falta content/resume.json', async () => {
    await rm(join(contentDir, 'resume.json'));
    expect(await checkContract({ distDir, contentDir })).toContain(`falta ${join(contentDir, 'resume.json')} — correr pnpm export`);
  });
});
