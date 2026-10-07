import matter from 'gray-matter';
import { extractSection, extractSubsections } from './sections.mjs';
import { MARKDOWN, readDiagram } from './diagram.mjs';

export const CATEGORIES = ['automatizacion', 'infraestructura', 'producto', 'clientes', 'herramientas-ia', 'hardware'];
export const STATUSES = ['activo', 'live', 'prototipo', 'completado'];

const CASE_SECTIONS = {
  es: { heading: 'Versión pública (ES)', map: { 'Título': 'title', 'Resumen': 'summary', 'Problema': 'problem', 'Solución': 'solution', 'Resultado': 'outcome' } },
  en: { heading: 'Public version (EN)', map: { Title: 'title', Summary: 'summary', Problem: 'problem', Solution: 'solution', Outcome: 'outcome' } },
};

// Título corto (opcional): subsección de cada sección pública; lo usan las pastillas del hero y las pestañas.
const SHORT_TITLE = { es: 'Título corto', en: 'Short title' };
const MAX_SHORT_TITLE = 24;

const PROFILE_SECTIONS = {
  es: { heading: 'Versión pública (ES)', map: { Titular: 'headline', 'Sobre mí': 'about', 'Educación': 'education', Experiencia: 'experience', Certificaciones: 'certifications', Hardware: 'hardware' } },
  en: { heading: 'Public version (EN)', map: { Headline: 'headline', About: 'about', Education: 'education', Experience: 'experience', Certifications: 'certifications', Hardware: 'hardware' } },
};

function fail(file, message) {
  throw new Error(`${file}: ${message}`);
}

function toDateString(value, file, field) {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  return fail(file, `${field} debe ser AAAA-MM-DD`);
}

function readLocalized(content, spec, file) {
  const text = {};
  for (const [locale, { heading, map }] of Object.entries(spec)) {
    const section = extractSection(content, heading);
    if (section === null) fail(file, `falta la sección "## ${heading}"`);
    if (section.includes('[[')) fail(file, `wikilink en "## ${heading}"`);
    const subsections = extractSubsections(section, Object.keys(map));
    text[locale] = {};
    for (const [name, key] of Object.entries(map)) {
      if (!subsections[name]) fail(file, `"### ${name}" vacío o ausente en "## ${heading}"`);
      text[locale][key] = subsections[name];
    }
  }
  return text;
}

function readShortTitles(content, file) {
  const found = {};
  for (const [locale, { heading }] of Object.entries(CASE_SECTIONS)) {
    const name = SHORT_TITLE[locale];
    const value = extractSubsections(extractSection(content, heading), [name])[name];
    if (value === null) continue;
    if (!value) fail(file, `"### ${name}" vacío en "## ${heading}"`);
    if (value.length > MAX_SHORT_TITLE) fail(file, `"### ${name}" tiene > ${MAX_SHORT_TITLE} caracteres: «${value}»`);
    if (value.includes('\n') || MARKDOWN.test(value)) fail(file, `"### ${name}" debe ser texto plano en una línea: «${value}»`);
    found[locale] = value;
  }
  const keys = Object.keys(found);
  if (keys.length === 1) fail(file, `el título corto debe existir en ambos idiomas (falta ${keys[0] === 'es' ? 'EN' : 'ES'})`);
  return keys.length === 0 ? null : found;
}

function readLinks(enlaces, file) {
  const links = {};
  for (const key of ['demo', 'repo']) {
    const value = enlaces?.[key];
    if (!value) continue;
    if (!/^https:\/\//.test(value)) fail(file, `enlaces.${key} debe empezar con https://`);
    links[key] = value;
  }
  return links;
}

export function parseCase(markdown, file) {
  const { data, content } = matter(markdown);
  if (data.publico !== true) return null;
  if (typeof data.slug !== 'string' || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(data.slug)) fail(file, 'slug inválido (ascii minúsculas con guiones)');
  if (![1, 2, 3].includes(data.destacado)) fail(file, 'destacado debe ser 1, 2 o 3');
  if (!CATEGORIES.includes(data.categoria)) fail(file, `categoria inválida: ${data.categoria}`);
  if (!STATUSES.includes(data.estado)) fail(file, `estado inválido: ${data.estado}`);
  if (!Array.isArray(data.stack) || data.stack.length === 0) fail(file, 'stack vacío');
  if (typeof data.periodo !== 'string' || !data.periodo.trim()) fail(file, 'periodo vacío');
  const result = {
    slug: data.slug,
    featured: data.destacado,
    category: data.categoria,
    stack: data.stack.map(String),
    period: data.periodo.trim(),
    status: data.estado,
    links: readLinks(data.enlaces, file),
    updated: toDateString(data.actualizado, file, 'actualizado'),
    text: readLocalized(content, CASE_SECTIONS, file),
  };
  const shortTitles = readShortTitles(content, file);
  if (shortTitles) for (const locale of Object.keys(shortTitles)) result.text[locale].shortTitle = shortTitles[locale];
  const diagram = readDiagram(content, file);
  if (diagram) result.diagram = diagram;
  return result;
}

export function parseProfile(markdown, file) {
  const { data, content } = matter(markdown);
  for (const field of ['nombre', 'email', 'github']) {
    if (typeof data[field] !== 'string' || !data[field].trim()) fail(file, `${field} vacío`);
  }
  const linkedin = data.linkedin ? String(data.linkedin) : '';
  if (linkedin && !/^https:\/\//.test(linkedin)) fail(file, 'linkedin debe empezar con https://');
  return {
    name: data.nombre,
    email: data.email,
    github: data.github,
    linkedin,
    updated: toDateString(data.actualizado, file, 'actualizado'),
    text: readLocalized(content, PROFILE_SECTIONS, file),
  };
}
