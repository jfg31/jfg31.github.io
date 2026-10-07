import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { preview } from 'astro';
import { chromium } from 'playwright-core';
import { isMain } from './lib/cli.mjs';
import { checkPdf, printPage, readPdf } from './lib/resume-print.mjs';
import { RESUME_VARIANTS, contactItems, resumeFileBase, resumePath } from './lib/resume-meta.mjs';
import portfolio from '../portfolio.config.mjs';

const PREVIEW_PORT = 4329;

async function launch() {
  try {
    return await chromium.launch();
  } catch (error) {
    throw new Error(`no se pudo abrir Chromium (${error.message.split('\n')[0]}). Instalar con: pnpm exec playwright-core install chromium`);
  }
}

/** Sirve dist/ con astro preview e imprime los 4 resumes. No escribe nada si la impresión falla antes. */
export async function renderResumePdfs({ root, contentDir, outDir, site, privateContact, isPrivate = false }) {
  const profile = JSON.parse(await readFile(join(contentDir, 'profile.json'), 'utf8'));
  const resume = JSON.parse(await readFile(join(contentDir, 'resume.json'), 'utf8'));
  const contact = privateContact ? contactItems({ profile, site, privateContact }) : undefined;
  await mkdir(outDir, { recursive: true });
  const server = await preview({ root, logLevel: 'error', server: { port: PREVIEW_PORT } });
  const written = [];
  const problems = [];
  try {
    const browser = await launch();
    try {
      for (const locale of ['en', 'es']) {
        for (const variant of RESUME_VARIANTS) {
          const url = `http://localhost:${server.port}${resumePath(locale, variant)}`;
          const pdf = await printPage(browser, url, { contact });
          const file = `${resumeFileBase(profile.name, variant, locale, { isPrivate })}.pdf`;
          const mustContain = [profile.name, resume.variants[variant][locale].title, ...(privateContact ? [privateContact.phone] : [])];
          problems.push(...checkPdf(await readPdf(pdf), { file, mustContain }));
          await writeFile(join(outDir, file), pdf);
          written.push(file);
        }
      }
    } finally {
      await browser.close();
    }
  } finally {
    await server.stop();
  }
  return { written, problems };
}

if (isMain(import.meta.url)) {
  try {
    const { written, problems } = await renderResumePdfs({
      root: resolve('.'),
      contentDir: resolve('content'),
      outDir: resolve('dist/resume'),
      site: portfolio.site,
    });
    if (problems.length > 0) {
      for (const p of problems) console.error(`✗ ${p}`);
      console.error('\nEl resume no cumple las reglas del PDF (acortar bullets en Resume.md si no cabe en 1 página).');
      process.exit(1);
    }
    console.log(`PDF del resume: ${written.join(', ')}`);
  } catch (error) {
    console.error(`PDF del resume falló — ${error.message}`);
    process.exit(1);
  }
}
