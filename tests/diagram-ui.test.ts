import { describe, it, expect } from 'vitest';
import { ui } from '../src/i18n/ui';
import { LOCALES } from '../src/themes/contract';
import { validateSteps } from '../scripts/lib/diagram.mjs';

describe('ui.sitePipeline', () => {
  for (const l of LOCALES) {
    it(`${l}: cumple las mismas reglas que un diagrama de caso`, () => {
      expect(() => validateSteps(ui[l].sitePipeline, `ui.${l}.sitePipeline`, 'sitePipeline')).not.toThrow();
    });
  }
  it('ES y EN tienen el mismo número de pasos', () => {
    expect(ui.es.sitePipeline).toHaveLength(ui.en.sitePipeline.length);
  });
});
