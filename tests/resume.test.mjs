import { describe, it, expect } from 'vitest';
import { parseResume, readResumePrivate } from '../scripts/lib/resume.mjs';

const publicSlugs = new Set(['uno', 'dos', 'tres']);

const locale = ({ section, h, extra = '' }) => `
## ${section}
### ${h.title} [ia]
AI Engineer ${section}
### ${h.title} [fullstack]
Full-Stack Developer ${section}
### ${h.summary} [ia]
Summary ai.
### ${h.summary} [fullstack]
Summary fullstack.
### ${h.skills}
- [ia] **Grupo A:** n8n, Ollama
- [ia, fullstack] **Grupo B:** Python, TypeScript
- [fullstack] **Grupo C:** Astro, React
- [ia, fullstack] **Grupo D:** Docker, Git
### ${h.experience}
Developer | Helvetia del Caribe | 2021 – presente
- [ia, fullstack] Bullet uno.
- [ia] Bullet dos ia.
- [fullstack] Bullet dos fs.
- [ia, fullstack] Bullet tres.
### ${h.projects}
- [ia] **Uno** (uno) — Proyecto uno.
- [ia, fullstack] **Dos** (dos) — Proyecto dos.
- [fullstack] **Tres** (tres) — Proyecto tres.
### ${h.education}
B.S. Computer Science | UPRB | 2021
### ${h.certifications}
Microsoft Office Specialist: Excel | Microsoft | 2020
${extra}`;

const ES = { section: 'Versión pública (ES)', h: { title: 'Título', summary: 'Resumen', skills: 'Habilidades', experience: 'Experiencia', projects: 'Proyectos', education: 'Educación', certifications: 'Certificaciones' } };
const EN = { section: 'Public version (EN)', h: { title: 'Title', summary: 'Summary', skills: 'Skills', experience: 'Experience', projects: 'Projects', education: 'Education', certifications: 'Certifications' } };

const doc = ({ es = locale(ES), en = locale(EN), privado = '## Privado\n- Teléfono: (787) 555-0199\n- Ciudad: Bayamón\n' } = {}) =>
  `---\nactualizado: 2026-10-06\n---\n# Resume\n${privado}\n${es}\n${en}`;

const parse = (md) => parseResume(md, 'Resume.md', { publicSlugs });

describe('parseResume', () => {
  it('reparte cada elemento a sus versiones, en orden', () => {
    const r = parse(doc());
    expect(r.updated).toBe('2026-10-06');
    const ai = r.variants.ai.en;
    expect(ai.title).toBe('AI Engineer Public version (EN)');
    expect(ai.skills.map((s) => s.group)).toEqual(['Grupo A', 'Grupo B', 'Grupo D']);
    expect(ai.experience).toEqual({ role: 'Developer', company: 'Helvetia del Caribe', dates: '2021 – presente', bullets: ['Bullet uno.', 'Bullet dos ia.', 'Bullet tres.'] });
    expect(ai.projects).toEqual([{ name: 'Uno', slug: 'uno', text: 'Proyecto uno.' }, { name: 'Dos', slug: 'dos', text: 'Proyecto dos.' }]);
    expect(r.variants.fullstack.es.projects.map((p) => p.slug)).toEqual(['dos', 'tres']);
    expect(ai.education).toEqual([{ title: 'B.S. Computer Science', institution: 'UPRB', year: '2021' }]);
    expect(ai.certifications).toEqual([{ title: 'Microsoft Office Specialist: Excel', issuer: 'Microsoft', year: '2020' }]);
  });

  it('nunca incluye la sección privada', () => {
    expect(JSON.stringify(parse(doc()))).not.toMatch(/555-0199|Bayamón/);
  });

  it.each([
    ['etiqueta desconocida', (s) => s.replace('- [ia] Bullet dos ia.', '- [web] Bullet dos ia.'), /etiqueta desconocida «web»/],
    ['bullet sin etiqueta', (s) => s.replace('- [ia] Bullet dos ia.', '- Bullet dos ia.'), /cada línea debe ser/],
    ['pocos bullets', (s) => s.replace('- [ia, fullstack] Bullet uno.\n', '').replace('- [ia, fullstack] Bullet tres.\n', ''), /bullets de experiencia \(debe haber entre 3 y 5\)/],
    ['bullet largo', (s) => s.replace('Bullet uno.', 'x'.repeat(221)), /máximo 220/],
    ['markdown en bullet', (s) => s.replace('Bullet uno.', 'Bullet *uno*.'), /texto plano/],
    ['caso no público', (s) => s.replace('(tres)', '(cuatro)'), /el caso «cuatro» no existe o no es público/],
    ['experiencia sin cabecera', (s) => s.replace('Developer | Helvetia del Caribe | 2021 – presente\n', ''), /primera línea debe ser "puesto \| empresa \| fechas"/],
    ['línea de educación mal formada', (s) => s.replace('B.S. Computer Science | UPRB | 2021', 'B.S. Computer Science, UPRB'), /la línea debe ser "a \| b \| c"/],
    ['falta un título', (s) => s.replace(/### (Título|Title) \[ia\]\n.*\n/, ''), /\[ia\]" vacío o ausente/],
  ])('falla con %s', (_name, mutate, error) => {
    expect(() => parse(doc({ en: mutate(locale(EN)) }))).toThrow(error);
  });

  it('falla si ES y EN no tienen los mismos conteos', () => {
    const en = locale(EN).replace('- [ia] Bullet dos ia.', '- [ia, fullstack] Bullet dos ia.').replace('- [fullstack] Bullet dos fs.\n', '');
    const es = locale(ES).replace('- [fullstack] Bullet dos fs.\n', '');
    expect(() => parse(doc({ es, en }))).toThrow(/versión fullstack: ES tiene 2 bullets de experiencia y EN 3|debe haber entre 3 y 5/);
  });

  it('falla si los proyectos ES y EN no apuntan a los mismos casos', () => {
    const en = locale(EN).replace('**Uno** (uno)', '**Tres** (tres)');
    expect(() => parse(doc({ en }))).toThrow(/proyecto 1: ES enlaza «uno» y EN «tres»/);
  });
});

describe('readResumePrivate', () => {
  it('lee teléfono y ciudad', () => {
    expect(readResumePrivate(doc(), 'Resume.md')).toEqual({ phone: '(787) 555-0199', city: 'Bayamón' });
  });
  it('falla sin teléfono o con el marcador …', () => {
    expect(() => readResumePrivate(doc({ privado: '## Privado\n- Teléfono: …\n- Ciudad: …\n' }), 'Resume.md')).toThrow(/Teléfono/);
    expect(() => readResumePrivate(doc({ privado: '' }), 'Resume.md')).toThrow(/falta la sección "## Privado"/);
  });
});
