import { describe, it, expect } from 'vitest';
import { parseDiagramList, readDiagram } from '../scripts/lib/diagram.mjs';

const list = ['1. **Vault** — notas privadas', '2. **Export** — JSON en ES y EN', '3. **Deploy** — GitHub Pages'].join('\n');

describe('parseDiagramList', () => {
  it('convierte la lista numerada en pasos', () => {
    expect(parseDiagramList(list, 'a.md', 'Diagrama')).toEqual([
      { label: 'Vault', detail: 'notas privadas' },
      { label: 'Export', detail: 'JSON en ES y EN' },
      { label: 'Deploy', detail: 'GitHub Pages' },
    ]);
  });
  it('ignora líneas vacías y tolera CRLF', () => {
    expect(parseDiagramList(list.replace(/\n/g, '\r\n\r\n'), 'a.md', 'Diagrama')).toHaveLength(3);
  });
  it.each([
    ['menos de 2 pasos', '1. **Solo** — uno'],
    ['más de 6 pasos', Array.from({ length: 7 }, (_, i) => `${i + 1}. **P${i}** — d`).join('\n')],
    ['formato', '1. Vault — sin negritas\n2. **B** — d'],
    ['etiqueta', `1. **${'x'.repeat(25)}** — d\n2. **B** — d`],
    ['detalle', `1. **A** — ${'y'.repeat(121)}\n2. **B** — d`],
    ['formato', '- **A** — viñeta\n- **B** — d'],
  ])('lanza error: %s', (msg, text) => {
    expect(() => parseDiagramList(text, 'a.md', 'Diagrama')).toThrow(msg);
  });
  it('incluye archivo y ubicación en el error', () => {
    expect(() => parseDiagramList('1. **A** — d', 'Caso.md', 'Diagram')).toThrow('Caso.md: "### Diagram"');
  });
});

const section = (es, en) => `## Versión pública (ES)\n### Título\nT\n${es}\n## Public version (EN)\n### Title\nT\n${en}\n`;
const ES = `### Diagrama\n${list}`;
const EN = '### Diagram\n1. **Vault** — private notes\n2. **Export** — JSON in ES and EN\n3. **Deploy** — GitHub Pages';

describe('readDiagram', () => {
  it('devuelve undefined si ningún idioma tiene diagrama', () => {
    expect(readDiagram(section('', ''), 'a.md')).toBeUndefined();
  });
  it('devuelve ambos idiomas', () => {
    const d = readDiagram(section(ES, EN), 'a.md');
    expect(d.es[0]).toEqual({ label: 'Vault', detail: 'notas privadas' });
    expect(d.en[2]).toEqual({ label: 'Deploy', detail: 'GitHub Pages' });
  });
  it('lanza si solo un idioma tiene diagrama', () => {
    expect(() => readDiagram(section(ES, ''), 'a.md')).toThrow('ambos idiomas');
  });
  it('lanza si el número de pasos difiere', () => {
    expect(() => readDiagram(section(ES, EN.split('\n').slice(0, 3).join('\n')), 'a.md')).toThrow('mismo número de pasos');
  });
});
