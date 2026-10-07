// Metadatos compartidos del resume: versiones, rutas, nombres de archivo, etiquetas y línea de contacto.
// Lo usan el export, las páginas Astro, el generador DOCX y los scripts de PDF (una sola fuente).
export const RESUME_VARIANTS = ['ai', 'fullstack'];

/** Etiqueta del vault → id de versión. */
export const RESUME_TAGS = { ia: 'ai', fullstack: 'fullstack' };

const SLUGS = { en: { ai: 'ai', fullstack: 'fullstack' }, es: { ai: 'ia', fullstack: 'fullstack' } };
const FILE_VARIANT = { ai: 'AI', fullstack: 'FullStack' };

export function variantSlug(locale, variant) {
  return SLUGS[locale][variant];
}

export function variantFromSlug(locale, slug) {
  return RESUME_VARIANTS.find((v) => SLUGS[locale][v] === slug) ?? null;
}

export function resumePath(locale, variant) {
  return `/${locale}/resume/${variantSlug(locale, variant)}/`;
}

export function resumeFileBase(name, variant, locale, { isPrivate = false } = {}) {
  const who = name.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z0-9]/g, '');
  return `${who}-Resume-${FILE_VARIANT[variant]}-${locale.toUpperCase()}${isPrivate ? '-privado' : ''}`;
}

export function resumeFileHref(name, variant, locale, ext) {
  return `/resume/${resumeFileBase(name, variant, locale)}.${ext}`;
}

export const RESUME_LABELS = {
  en: {
    resume: 'Resume',
    languageName: 'English',
    back: 'Portfolio',
    version: 'Version',
    downloadPdf: 'Download PDF',
    downloadDocx: 'Download DOCX',
    variants: { ai: 'Automation & AI', fullstack: 'Full-Stack' },
    sections: { summary: 'Summary', skills: 'Skills', experience: 'Experience', projects: 'Projects', education: 'Education', certifications: 'Certifications' },
  },
  es: {
    resume: 'Currículum',
    languageName: 'Español',
    back: 'Portfolio',
    version: 'Versión',
    downloadPdf: 'Descargar PDF',
    downloadDocx: 'Descargar DOCX',
    variants: { ai: 'Automatización e IA', fullstack: 'Full-Stack' },
    sections: { summary: 'Resumen', skills: 'Habilidades', experience: 'Experiencia', projects: 'Proyectos', education: 'Educación', certifications: 'Certificaciones' },
  },
};

/** Línea de contacto. Sin `privateContact` nunca incluye teléfono ni ciudad. */
export function contactItems({ profile, site, privateContact }) {
  const items = [{ key: 'location', text: privateContact?.city ? `${privateContact.city}, Puerto Rico` : 'Puerto Rico' }];
  if (privateContact?.phone) {
    items.push({ key: 'phone', text: privateContact.phone, href: `tel:${privateContact.phone.replace(/[^\d+]/g, '')}` });
  }
  items.push({ key: 'email', text: profile.email, href: `mailto:${profile.email}` });
  items.push({ key: 'site', text: new URL(site).host, href: site });
  items.push({ key: 'github', text: `github.com/${profile.github}`, href: `https://github.com/${profile.github}` });
  if (profile.linkedin) {
    items.push({ key: 'linkedin', text: profile.linkedin.replace(/^https:\/\/(www\.)?/, '').replace(/\/$/, ''), href: profile.linkedin });
  }
  return items;
}
