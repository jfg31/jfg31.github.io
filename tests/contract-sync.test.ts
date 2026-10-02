import { describe, it, expect } from 'vitest';
import { CATEGORIES, STATUSES as EXPORT_STATUSES } from '../scripts/lib/case.mjs';
import { CATEGORY_ORDER, STATUSES, LOCALES } from '../src/themes/contract';
import { ui } from '../src/i18n/ui';

describe('listas de categorías y estados en sincronía', () => {
  it('el exportador y el contrato del tema usan las mismas categorías', () => {
    expect([...CATEGORIES]).toEqual([...CATEGORY_ORDER]);
  });

  it('el exportador y el contrato del tema usan los mismos estados', () => {
    expect([...EXPORT_STATUSES]).toEqual([...STATUSES]);
  });

  it.each(LOCALES)('ui.%s: categories y statuses tienen exactamente esas claves', (locale) => {
    expect(Object.keys(ui[locale].categories).sort()).toEqual([...CATEGORY_ORDER].sort());
    expect(Object.keys(ui[locale].statuses).sort()).toEqual([...STATUSES].sort());
  });
});
