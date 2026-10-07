import matter from 'gray-matter';
import { extractSection, extractSubsections } from './sections.mjs';
import { MARKDOWN } from './diagram.mjs';
import { toDateString } from './case.mjs';
import { RESUME_TAGS, RESUME_VARIANTS } from './resume-meta.mjs';

export const RESUME_LIMITS = { experience: [3, 5], projects: [2, 3], skills: [3, 4], bullet: 220, summary: 400, title: 60, short: 120 };

const HEADINGS = {
  es: { section: 'Versión pública (ES)', title: 'Título', summary: 'Resumen', skills: 'Habilidades', experience: 'Experiencia', projects: 'Proyectos', education: 'Educación', certifications: 'Certificaciones' },
  en: { section: 'Public version (EN)', title: 'Title', summary: 'Summary', skills: 'Skills', experience: 'Experience', projects: 'Projects', education: 'Education', certifications: 'Certifications' },
};
const TAG_OF = { ai: 'ia', fullstack: 'fullstack' };

const ITEM = /^-\s+\[([^\]]+)\]\s+(.+)$/;
const SKILL = /^\*\*([^*]+?):\*\*\s+(.+)$/;
const PROJECT = /^\*\*([^*]+?)\*\*\s+\(([a-z0-9]+(?:-[a-z0-9]+)*)\)\s+—\s+(.+)$/;

function fail(file, message) {
  throw new Error(`${file}: ${message}`);
}

function lines(text) {
  return text.replace(/\r\n/g, '\n').split('\n').map((l) => l.trim()).filter(Boolean);
}

function plain(text, file, where, max) {
  if (!text) fail(file, `${where} vacío`);
  if (text.length > max) fail(file, `${where}: ${text.length} caracteres (máximo ${max}): «${text}»`);
  if (MARKDOWN.test(text)) fail(file, `${where} debe ser texto plano (sin markdown ni etiquetas): «${text}»`);
  return text;
}

function taggedItems(text, file, where) {
  return lines(text).map((line) => {
    const m = ITEM.exec(line);
    if (!m) fail(file, `${where}: cada línea debe ser "- [ia|fullstack] …": «${line}»`);
    const variants = new Set(
      m[1].split(',').map((raw) => {
        const tag = raw.trim();
        if (!RESUME_TAGS[tag]) fail(file, `${where}: etiqueta desconocida «${tag}» (usar ia o fullstack)`);
        return RESUME_TAGS[tag];
      }),
    );
    return { variants, body: m[2].trim() };
  });
}

function triple(line, file, where) {
  const parts = line.split('|').map((p) => p.trim());
  if (parts.length !== 3 || parts.some((p) => !p)) fail(file, `${where}: la línea debe ser "a | b | c": «${line}»`);
  return parts.map((p) => plain(p, file, where, RESUME_LIMITS.short));
}

function oneLine(text) {
  return text.replace(/\s*\n\s*/g, ' ');
}

function checkCounts(text, file, where) {
  const rules = [
    ['experience', text.experience.bullets.length, 'bullets de experiencia'],
    ['projects', text.projects.length, 'proyectos'],
    ['skills', text.skills.length, 'grupos de habilidades'],
  ];
  for (const [key, n, label] of rules) {
    const [min, max] = RESUME_LIMITS[key];
    if (n < min || n > max) fail(file, `${where}: ${n} ${label} (debe haber entre ${min} y ${max})`);
  }
}

function readLocale(content, locale, file, publicSlugs) {
  const h = HEADINGS[locale];
  const section = extractSection(content, h.section);
  if (section === null) fail(file, `falta la sección "## ${h.section}"`);
  if (section.includes('[[')) fail(file, `wikilink en "## ${h.section}"`);
  const perVariant = RESUME_VARIANTS.flatMap((v) => [`${h.title} [${TAG_OF[v]}]`, `${h.summary} [${TAG_OF[v]}]`]);
  const sub = extractSubsections(section, [...perVariant, h.skills, h.experience, h.projects, h.education, h.certifications]);
  const need = (name) => sub[name] || fail(file, `"### ${name}" vacío o ausente en "## ${h.section}"`);

  const skills = taggedItems(need(h.skills), file, h.skills).map(({ variants, body }) => {
    const m = SKILL.exec(body) ?? fail(file, `${h.skills}: usar "**Grupo:** a, b, c": «${body}»`);
    return { variants, value: { group: plain(m[1].trim(), file, h.skills, 40), items: plain(m[2].trim(), file, h.skills, RESUME_LIMITS.bullet) } };
  });

  const [header, ...rest] = lines(need(h.experience));
  if (header.startsWith('-')) fail(file, `${h.experience}: la primera línea debe ser "puesto | empresa | fechas"`);
  const [role, company, dates] = triple(header, file, h.experience);
  const bullets = taggedItems(rest.join('\n'), file, h.experience).map(({ variants, body }) => ({
    variants,
    value: plain(body, file, h.experience, RESUME_LIMITS.bullet),
  }));

  const projects = taggedItems(need(h.projects), file, h.projects).map(({ variants, body }) => {
    const m = PROJECT.exec(body) ?? fail(file, `${h.projects}: usar "**Nombre** (slug) — texto": «${body}»`);
    if (!publicSlugs.has(m[2])) fail(file, `${h.projects}: el caso «${m[2]}» no existe o no es público`);
    return { variants, value: { name: plain(m[1].trim(), file, h.projects, 40), slug: m[2], text: plain(m[3].trim(), file, h.projects, RESUME_LIMITS.bullet) } };
  });

  const education = lines(need(h.education)).map((l) => {
    const [title, institution, year] = triple(l, file, h.education);
    return { title, institution, year };
  });
  const certifications = lines(need(h.certifications)).map((l) => {
    const [title, issuer, year] = triple(l, file, h.certifications);
    return { title, issuer, year };
  });

  const pick = (items, v) => items.filter((i) => i.variants.has(v)).map((i) => i.value);
  const out = {};
  for (const v of RESUME_VARIANTS) {
    const tag = TAG_OF[v];
    out[v] = {
      title: plain(oneLine(need(`${h.title} [${tag}]`)), file, `${h.title} [${tag}]`, RESUME_LIMITS.title),
      summary: plain(oneLine(need(`${h.summary} [${tag}]`)), file, `${h.summary} [${tag}]`, RESUME_LIMITS.summary),
      skills: pick(skills, v),
      experience: { role, company, dates, bullets: pick(bullets, v) },
      projects: pick(projects, v),
      education,
      certifications,
    };
    checkCounts(out[v], file, `${h.section} [${tag}]`);
  }
  return out;
}

/** Secciones públicas de Resume.md → Resume. Nunca lee "## Privado". */
export function parseResume(markdown, file, { publicSlugs }) {
  const { data, content } = matter(markdown);
  const es = readLocale(content, 'es', file, publicSlugs);
  const en = readLocale(content, 'en', file, publicSlugs);
  const variants = {};
  for (const v of RESUME_VARIANTS) {
    const [a, b] = [es[v], en[v]];
    const counts = [
      ['bullets de experiencia', a.experience.bullets.length, b.experience.bullets.length],
      ['proyectos', a.projects.length, b.projects.length],
      ['grupos de habilidades', a.skills.length, b.skills.length],
      ['líneas de educación', a.education.length, b.education.length],
      ['certificaciones', a.certifications.length, b.certifications.length],
    ];
    for (const [label, x, y] of counts) if (x !== y) fail(file, `versión ${TAG_OF[v]}: ES tiene ${x} ${label} y EN ${y}`);
    a.projects.forEach((p, i) => {
      if (p.slug !== b.projects[i].slug) fail(file, `versión ${TAG_OF[v]}, proyecto ${i + 1}: ES enlaza «${p.slug}» y EN «${b.projects[i].slug}»`);
    });
    variants[v] = { es: a, en: b };
  }
  return { updated: toDateString(data.actualizado, file, 'actualizado'), variants };
}

/** Solo para la versión privada local: teléfono y ciudad de "## Privado". */
export function readResumePrivate(markdown, file) {
  const { content } = matter(markdown);
  const section = extractSection(content, 'Privado');
  if (section === null) fail(file, 'falta la sección "## Privado"');
  const field = (name) => {
    const value = new RegExp(`^-\\s+${name}:\\s*(.+)$`, 'm').exec(section)?.[1].trim() ?? '';
    return value === '…' ? '' : value;
  };
  const phone = field('Teléfono');
  if (phone.replace(/\D/g, '').length < 7) fail(file, '"## Privado" necesita "- Teléfono: <número>"');
  return { phone, city: field('Ciudad') };
}
