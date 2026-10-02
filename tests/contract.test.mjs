import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { checkContract } from '../scripts/check-contract.mjs';

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
  for (const l of ['en', 'es']) {
    await page(l);
    await page(`${l}/projects`, indexLinks('uno')(l));
    await page(`${l}/about`);
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
});
