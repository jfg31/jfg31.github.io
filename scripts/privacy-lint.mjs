import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { extname } from 'node:path';
import { isMain } from './lib/cli.mjs';
import { assertBlocklistUsable, findViolations, parseBlocklist } from './lib/privacy.mjs';

const SKIP_FILES = new Set(['pnpm-lock.yaml']);
const BINARY = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.ico', '.woff', '.woff2', '.pdf', '.avif']);

export function listRepoFiles(root) {
  const out = execFileSync('git', ['ls-files', '-z', '--cached', '--others', '--exclude-standard'], { cwd: root, encoding: 'utf8' });
  return out.split('\0').filter(Boolean).filter((f) => !SKIP_FILES.has(f) && !BINARY.has(extname(f).toLowerCase()));
}

export async function lintFiles(root, files, blocklist) {
  const results = [];
  for (const file of files) {
    let text;
    try {
      text = await readFile(`${root}/${file}`, 'utf8');
    } catch (err) {
      if (err.code === 'ENOENT') continue; // archivo listado pero borrado del working tree
      throw err;
    }
    for (const violation of findViolations(text, { blocklist })) results.push({ file, ...violation });
  }
  return results;
}

async function loadBlocklist() {
  const path = process.env.PORTFOLIO_BLOCKLIST;
  if (path) {
    const terms = parseBlocklist(await readFile(path, 'utf8'));
    try {
      assertBlocklistUsable(terms, path);
    } catch (err) {
      console.error(err.message);
      process.exit(1);
    }
    console.log(`Lista de bloqueo: ${terms.length} término(s).`);
    return terms;
  }
  if (process.env.CI) {
    console.warn('CI: sin lista de bloqueo privada, solo patrones genéricos.');
    return [];
  }
  console.error('Falta PORTFOLIO_BLOCKLIST (copiar .env.example a .env.local).');
  process.exit(1);
}

async function readStdin() {
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  return Buffer.concat(chunks).toString('utf8');
}

function show(match) {
  return process.env.CI ? `${match.slice(0, 3)}…` : match;
}

if (isMain(import.meta.url)) {
  const blocklist = await loadBlocklist();
  const results = process.argv.includes('--stdin')
    ? findViolations(await readStdin(), { blocklist }).map((v) => ({ file: '<stdin>', ...v }))
    : await lintFiles(process.cwd(), listRepoFiles(process.cwd()), blocklist);
  if (results.length > 0) {
    for (const r of results) console.error(`${r.file}: [${r.rule}] ${show(r.match)}`);
    console.error(`\n${results.length} posible(s) fuga(s) de datos sensibles. Corregir antes de publicar.`);
    process.exit(1);
  }
  console.log('Privacidad OK.');
}
