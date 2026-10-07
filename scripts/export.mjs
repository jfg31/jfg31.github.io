import { readdir, readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { isMain } from './lib/cli.mjs';
import { parseCase, parseProfile } from './lib/case.mjs';
import { parseResume } from './lib/resume.mjs';

function toJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

export async function exportAll({ portfolioDir, outDir }) {
  const casesDir = join(portfolioDir, 'Casos');
  const files = (await readdir(casesDir)).filter((name) => name.endsWith('.md')).sort();

  const cases = [];
  for (const file of files) {
    const parsed = parseCase(await readFile(join(casesDir, file), 'utf8'), file);
    if (parsed) cases.push(parsed);
  }

  const seen = new Set();
  for (const item of cases) {
    if (seen.has(item.slug)) throw new Error(`slug duplicado: ${item.slug}`);
    seen.add(item.slug);
  }

  const profile = parseProfile(await readFile(join(portfolioDir, 'Perfil.md'), 'utf8'), 'Perfil.md');

  let resumeMarkdown;
  try {
    resumeMarkdown = await readFile(join(portfolioDir, 'Resume.md'), 'utf8');
  } catch (err) {
    if (err.code === 'ENOENT') throw new Error('Resume.md no existe en PORTFOLIO_DIR (ver docs/ARCHITECTURE.md, sección Resume)');
    throw err;
  }
  const resume = parseResume(resumeMarkdown, 'Resume.md', { publicSlugs: seen });

  const outCases = join(outDir, 'cases');
  await rm(outCases, { recursive: true, force: true });
  await mkdir(outCases, { recursive: true });
  for (const item of cases) {
    await writeFile(join(outCases, `${item.slug}.json`), toJson(item), 'utf8');
  }
  await writeFile(join(outDir, 'profile.json'), toJson(profile), 'utf8');
  await writeFile(join(outDir, 'resume.json'), toJson(resume), 'utf8');

  return { cases: cases.length, skipped: files.length - cases.length, resume: true };
}

if (isMain(import.meta.url)) {
  const portfolioDir = process.env.PORTFOLIO_DIR;
  if (!portfolioDir) {
    console.error('Falta PORTFOLIO_DIR (copiar .env.example a .env.local)');
    process.exit(1);
  }
  try {
    const result = await exportAll({ portfolioDir, outDir: resolve('content') });
    console.log(`Exportados ${result.cases} casos públicos (${result.skipped} privados omitidos) + perfil + resume.`);
  } catch (error) {
    console.error(`Export falló — ${error.message}`);
    process.exit(1);
  }
}
