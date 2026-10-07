import { extractSection, extractSubsections } from './sections.mjs';
import { MIN_STEPS, MAX_STEPS, MAX_LABEL, MAX_DETAIL, maxWordLength } from './diagram-limits.mjs';

const LINE = /^\d+\.\s+\*\*(.+?)\*\*\s+—\s+(.+)$/;

const LOCALES = {
  es: { heading: 'Versión pública (ES)', sub: 'Diagrama' },
  en: { heading: 'Public version (EN)', sub: 'Diagram' },
};

function fail(file, where, message) {
  throw new Error(`${file}: "### ${where}" ${message}`);
}

// Sintaxis markdown que el tema mostraría literal: el detalle es texto plano (spec §9.2).
export const MARKDOWN = /[*_`<]|\[[^\]]*\]\(|^#/;

/** Valida pasos ya leídos ({label, detail}) con las mismas reglas que un diagrama de caso. */
export function validateSteps(steps, file, where) {
  if (steps.length < MIN_STEPS) fail(file, where, `tiene menos de ${MIN_STEPS} pasos`);
  if (steps.length > MAX_STEPS) fail(file, where, `tiene más de ${MAX_STEPS} pasos`);
  const limit = maxWordLength(steps.length);
  for (const { label, detail } of steps) {
    if (!label || label.length > MAX_LABEL) fail(file, where, `etiqueta vacía o > ${MAX_LABEL} caracteres: «${label}»`);
    const word = label.split(/\s+/).reduce((a, w) => (w.length > a.length ? w : a), '');
    if (word.length > limit) {
      fail(file, where, `la palabra «${word}» de la etiqueta «${label}» tiene ${word.length} caracteres y no cabe: con ${steps.length} pasos el límite es ${limit}`);
    }
    if (!detail || detail.length > MAX_DETAIL) fail(file, where, `detalle vacío o > ${MAX_DETAIL} caracteres en «${label}»`);
    if (MARKDOWN.test(detail)) fail(file, where, `detalle debe ser texto plano (sin markdown ni etiquetas) en «${label}»`);
  }
  return steps;
}

export function parseDiagramList(text, file, where) {
  const lines = text.replace(/\r\n/g, '\n').split('\n').map((l) => l.trim()).filter(Boolean);
  const steps = lines.map((line) => {
    const m = LINE.exec(line);
    if (!m) fail(file, where, `formato inválido en «${line}» (usar "1. **Etiqueta** — detalle")`);
    return { label: m[1].trim(), detail: m[2].trim() };
  });
  return validateSteps(steps, file, where);
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
