import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { isMain } from './lib/cli.mjs';
import { buildResumeDocx } from './lib/resume-docx.mjs';
import { RESUME_VARIANTS, resumeFileBase } from './lib/resume-meta.mjs';
import portfolio from '../portfolio.config.mjs';

export async function writeResumeDocx({ contentDir, outDir, site, privateContact, isPrivate = false }) {
  const profile = JSON.parse(await readFile(join(contentDir, 'profile.json'), 'utf8'));
  const resume = JSON.parse(await readFile(join(contentDir, 'resume.json'), 'utf8'));
  await mkdir(outDir, { recursive: true });
  const written = [];
  for (const locale of ['en', 'es']) {
    for (const variant of RESUME_VARIANTS) {
      const buffer = await buildResumeDocx({ profile, text: resume.variants[variant][locale], locale, site, privateContact });
      const file = `${resumeFileBase(profile.name, variant, locale, { isPrivate })}.docx`;
      await writeFile(join(outDir, file), buffer);
      written.push(file);
    }
  }
  return written;
}

if (isMain(import.meta.url)) {
  try {
    const written = await writeResumeDocx({ contentDir: resolve('content'), outDir: resolve('dist/resume'), site: portfolio.site });
    console.log(`DOCX del resume: ${written.join(', ')}`);
  } catch (error) {
    console.error(`DOCX del resume falló — ${error.message}`);
    process.exit(1);
  }
}
