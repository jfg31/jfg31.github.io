import { describe, it, expect } from 'vitest';
import { layoutSteps, layoutStepsVertical, wrapLabel } from '../src/themes/glass/scripts/layout';

describe('layoutSteps', () => {
  it('reparte n nodos sin solaparse y dentro del lienzo', () => {
    const boxes = layoutSteps(5, 1000, 200);
    expect(boxes).toHaveLength(5);
    for (const b of boxes) {
      expect(b.x).toBeGreaterThanOrEqual(0);
      expect(b.x + b.w).toBeLessThanOrEqual(1000);
      expect(b.y).toBeGreaterThanOrEqual(0);
      expect(b.y + b.h).toBeLessThanOrEqual(200);
    }
    for (let i = 1; i < boxes.length; i++) expect(boxes[i].x).toBeGreaterThan(boxes[i - 1].x + boxes[i - 1].w);
  });
  it('mantiene separación constante entre nodos', () => {
    const b = layoutSteps(4, 800, 160);
    const gaps = b.slice(1).map((box, i) => box.x - (b[i].x + b[i].w));
    expect(new Set(gaps.map((g) => g.toFixed(3))).size).toBe(1);
  });
  it.each([2, 6])('funciona con %i pasos', (n) => {
    expect(layoutSteps(n, 600, 120)).toHaveLength(n);
  });
});

describe('layoutStepsVertical', () => {
  it('apila los nodos en columna dentro del lienzo, sin solaparse', () => {
    const boxes = layoutStepsVertical(5, 400, 640);
    expect(boxes).toHaveLength(5);
    for (const b of boxes) {
      expect(b.x).toBeGreaterThanOrEqual(0);
      expect(b.x + b.w).toBeLessThanOrEqual(400);
      expect(b.y + b.h).toBeLessThanOrEqual(640);
    }
    for (let i = 1; i < boxes.length; i++) expect(boxes[i].y).toBeGreaterThan(boxes[i - 1].y + boxes[i - 1].h);
  });
});

describe('wrapLabel', () => {
  it('deja en una línea lo que cabe', () => {
    expect(wrapLabel('Privacy lint', 12)).toEqual(['Privacy lint']);
  });
  it('parte por palabras sin cortar ninguna', () => {
    expect(wrapLabel('Necesidad detectada', 12)).toEqual(['Necesidad', 'detectada']);
    expect(wrapLabel('Cloudflare', 4)).toEqual(['Cloudflare']);
  });
});
