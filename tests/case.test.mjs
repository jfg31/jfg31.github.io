import { describe, it, expect } from 'vitest';
import { parseCase, parseProfile } from '../scripts/lib/case.mjs';

const publicSections = `
## Versión pública (ES)
### Título
Asistente IA
### Resumen
Resumen ES
### Problema
Problema ES
### Solución
Solución ES
### Resultado
Resultado ES

## Public version (EN)
### Title
AI Assistant
### Summary
Summary EN
### Problem
Problem EN
### Solution
Solution EN
### Outcome
Outcome EN
`;

const caseMd = (front, body = publicSections) => `---\n${front}\n---\n# Caso\n\n## Problema\nDetalle privado\n${body}`;

const validFront = [
  'slug: asistente-ia',
  'publico: true',
  'destacado: 1',
  'categoria: automatizacion',
  'proyectos: ["[[01 - Projects/x]]"]',
  'stack: [Python, Ollama]',
  'periodo: 2025-03 → presente',
  'estado: activo',
  'enlaces: { demo: "https://example.com", repo: "" }',
  'actualizado: 2026-10-01',
].join('\n');

describe('parseCase', () => {
  it('convierte un caso público válido al contrato', () => {
    const c = parseCase(caseMd(validFront), 'a.md');
    expect(c).toEqual({
      slug: 'asistente-ia',
      featured: 1,
      category: 'automatizacion',
      stack: ['Python', 'Ollama'],
      period: '2025-03 → presente',
      status: 'activo',
      links: { demo: 'https://example.com' },
      updated: '2026-10-01',
      text: {
        es: { title: 'Asistente IA', summary: 'Resumen ES', problem: 'Problema ES', solution: 'Solución ES', outcome: 'Resultado ES' },
        en: { title: 'AI Assistant', summary: 'Summary EN', problem: 'Problem EN', solution: 'Solution EN', outcome: 'Outcome EN' },
      },
    });
  });

  it('no exporta secciones privadas ni frontmatter fuera de la allowlist', () => {
    const json = JSON.stringify(parseCase(caseMd(validFront), 'a.md'));
    expect(json).not.toContain('Detalle privado');
    expect(json).not.toContain('proyectos');
    expect(json).not.toContain('[[');
  });

  it('devuelve null para casos privados', () => {
    expect(parseCase(caseMd(validFront.replace('publico: true', 'publico: false')), 'a.md')).toBeNull();
  });

  it.each([
    ['slug inválido', validFront.replace('slug: asistente-ia', 'slug: Asistente IA')],
    ['destacado', validFront.replace('destacado: 1', 'destacado: 5')],
    ['categoria inválida', validFront.replace('categoria: automatizacion', 'categoria: otra')],
    ['estado inválido', validFront.replace('estado: activo', 'estado: pausado')],
    ['stack vacío', validFront.replace('stack: [Python, Ollama]', 'stack: []')],
    ['https://', validFront.replace('https://example.com', 'http://example.com')],
  ])('lanza error: %s', (msg, front) => {
    expect(() => parseCase(caseMd(front), 'a.md')).toThrow(msg);
  });

  it('lanza si falta una sección pública', () => {
    const body = publicSections.split('## Public version (EN)')[0];
    expect(() => parseCase(caseMd(validFront, body), 'a.md')).toThrow('## Public version (EN)');
  });

  it('lanza si una subsección pública está vacía', () => {
    const body = publicSections.replace('Outcome EN', '');
    expect(() => parseCase(caseMd(validFront, body), 'a.md')).toThrow('### Outcome');
  });

  it('lanza si una sección pública contiene wikilinks', () => {
    const body = publicSections.replace('Solution EN', 'ver [[nota]]');
    expect(() => parseCase(caseMd(validFront, body), 'a.md')).toThrow('wikilink');
  });

  it('incluye el nombre del archivo en el error', () => {
    expect(() => parseCase(caseMd(validFront.replace('estado: activo', 'estado: x')), 'Mi caso.md')).toThrow('Mi caso.md');
  });
});

const profileMd = (front) => `---\n${front}\n---\n# Perfil\n## Educación\nprivado\n
## Versión pública (ES)
### Titular
Ingeniero
### Sobre mí
Bio
### Educación
UPRB
### Experiencia
Empresa
### Certificaciones
MOS
### Hardware
PCs

## Public version (EN)
### Headline
Engineer
### About
Bio EN
### Education
UPRB EN
### Experience
Empresa EN
### Certifications
MOS EN
### Hardware
PCs EN
`;

const profileFront = ['nombre: Jose Flores', 'email: jfloresgandara31@gmail.com', 'github: jfg31', 'linkedin: ""', 'actualizado: 2026-10-01'].join('\n');

describe('parseProfile', () => {
  it('convierte el perfil al contrato', () => {
    const p = parseProfile(profileMd(profileFront), 'Perfil.md');
    expect(p.name).toBe('Jose Flores');
    expect(p.github).toBe('jfg31');
    expect(p.linkedin).toBe('');
    expect(p.updated).toBe('2026-10-01');
    expect(p.text.es.headline).toBe('Ingeniero');
    expect(p.text.en.hardware).toBe('PCs EN');
    expect(JSON.stringify(p)).not.toContain('privado');
  });

  it('lanza si falta github', () => {
    expect(() => parseProfile(profileMd(profileFront.replace('github: jfg31', 'github: ""')), 'Perfil.md')).toThrow('github');
  });

  it('lanza si linkedin no es https', () => {
    expect(() => parseProfile(profileMd(profileFront.replace('linkedin: ""', 'linkedin: linkedin.com/in/x')), 'Perfil.md')).toThrow('linkedin');
  });
});
