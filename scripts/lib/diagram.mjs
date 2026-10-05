import { extractSection, extractSubsections } from './sections.mjs';

const MIN_STEPS = 2;
const MAX_STEPS = 6;
const MAX_LABEL = 24;
const MAX_DETAIL = 120;
const LINE = /^\d+\.\s+\*\*(.+?)\*\*\s+—\s+(.+)$/;

const LOCALES = {
  es: { heading: 'Versión pública (ES)', sub: 'Diagrama' },
  en: { heading: 'Public version (EN)', sub: 'Diagram' },
};

function fail(file, where, message) {
  throw new Error(`${file}: "### ${where}" ${message}`);
}

export function parseDiagramList(text, file, where) {
  const lines = text.replace(/\r\n/g, '\n').split('\n').map((l) => l.trim()).filter(Boolean);
  const steps = lines.map((line) => {
    const m = LINE.exec(line);
    if (!m) fail(file, where, `formato inválido en «${line}» (usar "1. **Etiqueta** — detalle")`);
    const label = m[1].trim();
    const detail = m[2].trim();
    if (!label || label.length > MAX_LABEL) fail(file, where, `etiqueta vacía o > ${MAX_LABEL} caracteres: «${label}»`);
    if (!detail || detail.length > MAX_DETAIL) fail(file, where, `detalle vacío o > ${MAX_DETAIL} caracteres en «${label}»`);
    return { label, detail };
  });
  if (steps.length < MIN_STEPS) fail(file, where, `tiene menos de ${MIN_STEPS} pasos`);
  if (steps.length > MAX_STEPS) fail(file, where, `tiene más de ${MAX_STEPS} pasos`);
  return steps;
}

export function readDiagram(content, file) {
  const found = {};
  for (const [locale, { heading, sub }] of Object.entries(LOCALES)) {
    const section = extractSection(content, heading);
    const text = section === null ? null : extractSubsections(section, [sub])[sub];
    if (text) found[locale] = parseDiagramList(text, file, sub);
  }
  const keys = Object.keys(found);
  if (keys.length === 0) return undefined;
  if (keys.length === 1) throw new Error(`${file}: el diagrama debe existir en ambos idiomas (falta ${keys[0] === 'es' ? 'EN' : 'ES'})`);
  if (found.es.length !== found.en.length) throw new Error(`${file}: el diagrama ES y EN deben tener el mismo número de pasos`);
  return found;
}
