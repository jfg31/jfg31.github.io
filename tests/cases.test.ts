import { describe, it, expect } from 'vitest';
import { sortCases, featuredCases, groupByCategory, formatPeriod } from '../src/lib/cases';
import type { Case } from '../src/themes/contract';

const make = (slug: string, featured: 1 | 2 | 3, category: Case['category'], updated = '2026-01-01'): Case => ({
  slug, featured, category, updated, stack: ['x'], period: 'p', status: 'activo', links: {},
  text: { en: { title: slug, summary: '', problem: '', solution: '', outcome: '' }, es: { title: slug, summary: '', problem: '', solution: '', outcome: '' } },
});

describe('sortCases', () => {
  it('ordena por destacado, luego más reciente, luego slug', () => {
    const sorted = sortCases([make('c', 2, 'producto'), make('b', 1, 'hardware', '2026-01-01'), make('a', 1, 'hardware', '2026-05-01'), make('d', 2, 'producto')]);
    expect(sorted.map((c) => c.slug)).toEqual(['a', 'b', 'c', 'd']);
  });
  it('no muta el arreglo original', () => {
    const input = [make('b', 2, 'producto'), make('a', 1, 'producto')];
    sortCases(input);
    expect(input.map((c) => c.slug)).toEqual(['b', 'a']);
  });
});

describe('featuredCases', () => {
  it('devuelve solo destacado 1', () => {
    expect(featuredCases([make('a', 1, 'producto'), make('b', 2, 'producto')]).map((c) => c.slug)).toEqual(['a']);
  });
});

describe('groupByCategory', () => {
  it('agrupa en el orden canónico y omite categorías vacías', () => {
    const groups = groupByCategory([make('h', 1, 'hardware'), make('a', 2, 'automatizacion'), make('a2', 1, 'automatizacion')]);
    expect(groups.map(([cat, items]) => [cat, items.map((c) => c.slug)])).toEqual([
      ['automatizacion', ['a2', 'a']],
      ['hardware', ['h']],
    ]);
  });
});

describe('formatPeriod', () => {
  it('en inglés traduce "presente" a "present"', () => {
    expect(formatPeriod('2026-06 → presente', 'en')).toBe('2026-06 → present');
  });
  it('en español deja el periodo intacto', () => {
    expect(formatPeriod('2026-06 → presente', 'es')).toBe('2026-06 → presente');
  });
  it('no toca periodos sin la palabra "presente"', () => {
    expect(formatPeriod('2024-01 → 2025-03', 'en')).toBe('2024-01 → 2025-03');
  });
});
