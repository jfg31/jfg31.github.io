import { describe, it, expect } from 'vitest';
import { ui, localePath, otherLocale } from '../src/i18n/ui';
import { LOCALES } from '../src/themes/contract';

function leaves(obj: unknown, prefix = ''): [string, unknown][] {
  if (typeof obj !== 'object' || obj === null) return [[prefix, obj]];
  return Object.entries(obj).flatMap(([k, v]) => leaves(v, prefix ? `${prefix}.${k}` : k));
}

describe('ui strings', () => {
  it('cada idioma tiene las mismas claves y ninguna vacía', () => {
    const [first, ...rest] = LOCALES.map((l) => leaves(ui[l]));
    for (const other of rest) expect(other.map(([k]) => k)).toEqual(first.map(([k]) => k));
    for (const l of LOCALES) for (const [key, value] of leaves(ui[l])) expect(value, `${l}.${key}`).toBeTruthy();
  });
});

describe('localePath / otherLocale', () => {
  it('construye rutas con slash final', () => {
    expect(localePath('en')).toBe('/en/');
    expect(localePath('es', 'projects')).toBe('/es/projects/');
    expect(localePath('es', '/projects/x/')).toBe('/es/projects/x/');
  });
  it('alterna idioma', () => {
    expect(otherLocale('en')).toBe('es');
    expect(otherLocale('es')).toBe('en');
  });
});
