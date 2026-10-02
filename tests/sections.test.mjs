import { describe, it, expect } from 'vitest';
import { extractSection, extractSubsections } from '../scripts/lib/sections.mjs';

const md = [
  '# Caso',
  '## Problema',
  'privado',
  '## Versión pública (ES)',
  '### Título',
  'Mi título',
  '### Resumen',
  'Línea 1',
  'Línea 2',
  '## Public version (EN)',
  '### Title',
  'My title',
].join('\r\n');

describe('extractSection', () => {
  it('devuelve el texto hasta el siguiente heading de nivel 2', () => {
    expect(extractSection(md, 'Versión pública (ES)')).toBe('### Título\nMi título\n### Resumen\nLínea 1\nLínea 2');
  });
  it('devuelve la última sección hasta el final', () => {
    expect(extractSection(md, 'Public version (EN)')).toBe('### Title\nMy title');
  });
  it('devuelve null si no existe', () => {
    expect(extractSection(md, 'No existe')).toBeNull();
  });
  it('no confunde ### con ##', () => {
    expect(extractSection(md, 'Título')).toBeNull();
  });
});

describe('extractSubsections', () => {
  it('extrae cada subsección pedida', () => {
    const section = extractSection(md, 'Versión pública (ES)');
    expect(extractSubsections(section, ['Título', 'Resumen', 'Problema'])).toEqual({
      'Título': 'Mi título',
      'Resumen': 'Línea 1\nLínea 2',
      'Problema': null,
    });
  });
  it('ignora subsecciones no pedidas sin mezclarlas', () => {
    const section = '### A\nuno\n### Extra\nno\n### B\ndos';
    expect(extractSubsections(section, ['A', 'B'])).toEqual({ A: 'uno', B: 'dos' });
  });
});
