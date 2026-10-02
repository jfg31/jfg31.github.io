import { CATEGORY_ORDER, type Case, type Category, type Locale } from '../themes/contract';

export function sortCases(cases: Case[]): Case[] {
  return [...cases].sort(
    (a, b) => a.featured - b.featured || b.updated.localeCompare(a.updated) || a.slug.localeCompare(b.slug),
  );
}

export function featuredCases(cases: Case[]): Case[] {
  return sortCases(cases).filter((item) => item.featured === 1);
}

export function groupByCategory(cases: Case[]): [Category, Case[]][] {
  const sorted = sortCases(cases);
  return CATEGORY_ORDER.map((category): [Category, Case[]] => [category, sorted.filter((item) => item.category === category)]).filter(
    ([, items]) => items.length > 0,
  );
}

// Los periodos se guardan en español ("2026-06 → presente"); en EN se localiza la palabra final.
export function formatPeriod(period: string, locale: Locale): string {
  return locale === 'en' ? period.replace(/\bpresente\b/g, 'present') : period;
}
