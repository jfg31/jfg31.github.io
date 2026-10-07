import { readFile } from 'node:fs/promises';
import { join, relative, resolve, isAbsolute } from 'node:path';
import { isMain } from './lib/cli.mjs';
import { readResumePrivate } from './lib/resume.mjs';
import { writeResumeDocx } from './resume-docx.mjs';
import { renderResumePdfs } from './resume-pdf.mjs';
import portfolio from '../portfolio.config.mjs';

/** Carpeta de salida de la versión privada; nunca dentro del repo público. */
export function privateOutDir(portfolioDir, repoRoot) {
  const out = join(resolve(portfolioDir), 'Resume - archivos');
  const rel = relative(resolve(repoRoot), out);
  if (rel === '' || (!rel.startsWith('..') && !isAbsolute(rel))) throw new Error(`la salida privada quedaría dentro del repo: ${out}`);
  return out;
}

if (isMain(import.meta.url)) {
  const portfolioDir = process.env.PORTFOLIO_DIR;
  if (!portfolioDir) {
    console.error('Falta PORTFOLIO_DIR (copiar .env.example a .env.local)');
    process.exit(1);
  }
  try {
    const privateContact = readResumePrivate(await readFile(join(portfolioDir, 'Resume.md'), 'utf8'), 'Resume.md');
    const outDir = privateOutDir(portfolioDir, resolve('.'));
    const common = { contentDir: resolve('content'), outDir, site: portfolio.site, privateContact, isPrivate: true };
    const docx = await writeResumeDocx(common);
    const { written, problems } = await renderResumePdfs({ ...common, root: resolve('.') });
    if (problems.length > 0) {
      for (const p of problems) console.error(`✗ ${p}`);
      process.exit(1);
    }
    console.log(`Resume privado en ${outDir}:\n  ${[...written, ...docx].join('\n  ')}`);
  } catch (error) {
    console.error(`Resume privado falló — ${error.message}`);
    process.exit(1);
  }
}
