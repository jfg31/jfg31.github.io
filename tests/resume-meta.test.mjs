import { describe, it, expect } from 'vitest';
import {
  RESUME_VARIANTS, RESUME_LABELS, variantSlug, variantFromSlug, resumePath,
  resumeFileBase, resumeFileHref, contactItems,
} from '../scripts/lib/resume-meta.mjs';

const profile = { name: 'Jose Flores', email: 'jfloresgandara31@gmail.com', github: 'jfg31', linkedin: '' };
const site = 'https://jfg31.github.io';

describe('resume-meta', () => {
  it('versiones y slugs por idioma', () => {
    expect(RESUME_VARIANTS).toEqual(['ai', 'fullstack']);
    expect(variantSlug('en', 'ai')).toBe('ai');
    expect(variantSlug('es', 'ai')).toBe('ia');
    expect(variantSlug('es', 'fullstack')).toBe('fullstack');
    expect(variantFromSlug('es', 'ia')).toBe('ai');
    expect(variantFromSlug('en', 'ia')).toBeNull();
  });

  it('rutas y nombres de archivo', () => {
    expect(resumePath('es', 'ai')).toBe('/es/resume/ia/');
    expect(resumeFileBase('Jose Flores', 'fullstack', 'es')).toBe('JoseFlores-Resume-FullStack-ES');
    expect(resumeFileBase('José Flores', 'ai', 'en', { isPrivate: true })).toBe('JoseFlores-Resume-AI-EN-privado');
    expect(resumeFileHref('Jose Flores', 'ai', 'en', 'pdf')).toBe('/resume/JoseFlores-Resume-AI-EN.pdf');
  });

  it('etiquetas con las mismas claves en EN y ES', () => {
    const keys = (o) => JSON.stringify(Object.keys(o).sort()) + JSON.stringify(Object.keys(o.sections).sort());
    expect(keys(RESUME_LABELS.en)).toBe(keys(RESUME_LABELS.es));
  });

  it('contacto público: sin teléfono, ubicación Puerto Rico, LinkedIn solo si existe', () => {
    const items = contactItems({ profile, site });
    expect(items.map((i) => i.key)).toEqual(['location', 'email', 'site', 'github']);
    expect(items[0].text).toBe('Puerto Rico');
    expect(items.find((i) => i.key === 'site').text).toBe('jfg31.github.io');
    const withLinkedin = contactItems({ profile: { ...profile, linkedin: 'https://www.linkedin.com/in/x/' }, site });
    expect(withLinkedin.at(-1)).toEqual({ key: 'linkedin', text: 'linkedin.com/in/x', href: 'https://www.linkedin.com/in/x/' });
  });

  it('contacto privado: ciudad y teléfono', () => {
    const items = contactItems({ profile, site, privateContact: { phone: '(787) 555-0199', city: 'Bayamón' } });
    expect(items.slice(0, 2)).toEqual([
      { key: 'location', text: 'Bayamón, Puerto Rico' },
      { key: 'phone', text: '(787) 555-0199', href: 'tel:7875550199' },
    ]);
  });
});
