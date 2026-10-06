import { describe, it, expect } from 'vitest';
import { parseDiagramList, readDiagram } from '../scripts/lib/diagram.mjs';
import { maxWordLength, maxLineChars } from '../scripts/lib/diagram-limits.mjs';
import { layoutSteps, layoutStepsVertical } from '../src/themes/glass/scripts/layout';

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

describe('límites de etiqueta según el número de pasos', () => {
  it('tabla de la palabra más larga permitida', () => {
    expect([2, 3, 4, 5, 6].map(maxWordLength)).toEqual([16, 16, 16, 12, 9]);
  });
  it('coincide con el ancho de nodo que dibuja el tema, en fila y en columna', () => {
    for (const n of [2, 3, 4, 5, 6]) {
      const fit = (w) => Math.floor((w - 24) / (17 * 0.56));
      const h = fit(layoutSteps(n, 1000, 200)[0].w);
      const v = fit(layoutStepsVertical(n, 400, 120 * n + 40)[0].w);
      expect(maxLineChars(n, 'h')).toBe(h);
      expect(maxLineChars(n, 'v')).toBe(v);
      expect(maxWordLength(n)).toBe(Math.min(24, h, v));
    }
  });
  const pipeline = (word, n) =>
    Array.from({ length: n }, (_, i) => `${i + 1}. **${i === 0 ? word : 'P' + i}** — detalle`).join('\n');
  it.each([2, 3, 4, 5, 6])('acepta una palabra del largo máximo con %i pasos', (n) => {
    expect(() => parseDiagramList(pipeline('x'.repeat(maxWordLength(n)), n), 'a.md', 'Diagrama')).not.toThrow();
  });
  it.each([5, 6])('rechaza una palabra de un carácter más con %i pasos', (n) => {
    const word = 'x'.repeat(maxWordLength(n) + 1);
    expect(() => parseDiagramList(pipeline(word, n), 'a.md', 'Diagrama')).toThrow(
      `«${word}» de la etiqueta «${word}» tiene ${word.length} caracteres y no cabe: con ${n} pasos el límite es ${maxWordLength(n)}`,
    );
  });
  it('el mismo largo es válido con menos pasos', () => {
    expect(() => parseDiagramList(pipeline('Contenedores!', 4), 'a.md', 'Diagrama')).not.toThrow();
  });
  it('varias palabras cortas sí caben aunque la etiqueta sea larga', () => {
    expect(() => parseDiagramList(pipeline('uno dos tres cuatro', 6), 'a.md', 'Diagrama')).not.toThrow();
  });
});

describe('detalle en texto plano', () => {
  it.each([
    ['asterisco', 'con *énfasis*'],
    ['guion bajo', 'con _énfasis_'],
    ['comilla invertida', 'usa `código`'],
    ['enlace', 'ver [aquí](https://x.y)'],
    ['etiqueta', 'texto <b>fuerte</b>'],
    ['encabezado', '# título'],
  ])('rechaza markdown: %s', (_n, detail) => {
    expect(() => parseDiagramList(`1. **A** — ${detail}\n2. **B** — d`, 'a.md', 'Diagrama')).toThrow('detalle debe ser texto plano');
  });
  it('acepta signos normales y # que no está al inicio', () => {
    expect(() => parseDiagramList('1. **A** — Caso #1: rápido (y barato), 100%.\n2. **B** — d', 'a.md', 'Diagrama')).not.toThrow();
  });
});
