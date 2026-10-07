import { describe, it, expect } from 'vitest';
import { checkPdf } from '../scripts/lib/resume-print.mjs';

describe('checkPdf', () => {
  const opts = { file: 'R.pdf', mustContain: ['Jose Flores', 'Automation & AI Engineer'] };

  it('acepta 1 página con el texto esperado (normalizando espacios y compatibilidad Unicode)', () => {
    expect(checkPdf({ totalPages: 1, text: 'Jose\nFlores  Automation & AI Engineer' }, opts)).toEqual([]);
    expect(checkPdf({ totalPages: 1, text: 'Jose Flores Automation & AI Engineer ﬁ' }, opts)).toEqual([]);
  });

  it('rechaza más de una página', () => {
    expect(checkPdf({ totalPages: 2, text: 'Jose Flores Automation & AI Engineer' }, opts)).toEqual(['R.pdf: tiene 2 páginas (debe caber en 1)']);
  });

  it('rechaza texto no extraíble o incompleto', () => {
    expect(checkPdf({ totalPages: 1, text: '' }, opts)).toEqual([
      'R.pdf: el texto extraído no contiene «Jose Flores»',
      'R.pdf: el texto extraído no contiene «Automation & AI Engineer»',
    ]);
  });
});
