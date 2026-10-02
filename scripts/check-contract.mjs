import { existsSync } from 'node:fs';
import { readdir, readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { isMain } from './lib/cli.mjs';

const GENERAL_PAGES = ['', 'projects', 'about'];

function escapeHtml(text) {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function stripHead(html) {
  return html.replace(/<head[\s>][\s\S]*?<\/head>/i, '');
}

function pagePath(distDir, locale, sub) {
  return join(distDir, locale, sub, 'index.html');
}

export async function checkContract({ distDir, contentDir, locales = ['en', 'es'] }) {
  const problems = [];
  for (const locale of locales) {
    for (const sub of GENERAL_PAGES) {
      if (!existsSync(pagePath(distDir, locale, sub))) problems.push(`falta ${[locale, sub].filter(Boolean).join('/')}/index.html`);
    }
  }
  const casesDirPath = join(contentDir, 'cases');
  let files;
  try {
    files = (await readdir(casesDirPath)).filter((f) => f.endsWith('.json')).sort();
  } catch (err) {
    if (err.code === 'ENOENT') {
      problems.push(`falta ${casesDirPath} — correr pnpm export`);
      return problems;
    }
    throw err;
  }
  const indexHtml = {};
  for (const locale of locales) {
    const indexPath = pagePath(distDir, locale, 'projects');
    if (existsSync(indexPath)) indexHtml[locale] = await readFile(indexPath, 'utf8');
  }
  for (const file of files) {
    const item = JSON.parse(await readFile(join(casesDirPath, file), 'utf8'));
    for (const locale of locales) {
      if (indexHtml[locale] !== undefined && !indexHtml[locale].includes(`/${locale}/projects/${item.slug}/`)) {
        problems.push(`${locale}/projects/index.html: no enlaza al caso "${item.slug}"`);
      }
      const rel = `${locale}/projects/${item.slug}`;
      const path = pagePath(distDir, locale, `projects/${item.slug}`);
      if (!existsSync(path)) {
        problems.push(`falta ${rel}/index.html`);
        continue;
      }
      const html = stripHead(await readFile(path, 'utf8'));
      const title = item.text[locale].title;
      if (!html.includes(title) && !html.includes(escapeHtml(title))) problems.push(`${rel}: no aparece el título "${title}"`);
    }
  }
  return problems;
}

if (isMain(import.meta.url)) {
  const problems = await checkContract({ distDir: resolve('dist'), contentDir: resolve('content') });
  if (problems.length > 0) {
    for (const p of problems) console.error(`✗ ${p}`);
    console.error(`\nEl tema activo no cumple el contrato (${problems.length} problema(s)).`);
    process.exit(1);
  }
  console.log('Contrato de tema OK.');
}
