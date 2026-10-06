// Geometría pura del diagrama del tema glass (sin DOM: se usa en el build de Astro y en los tests).

import { MARGIN, GAP_RATIO, NODE_H, nodeWidth } from '../../../../scripts/lib/diagram-limits.mjs';

export interface Box { x: number; y: number; w: number; h: number }

/** Nodos en fila, centrados verticalmente, con márgenes y separación iguales. */
export function layoutSteps(count: number, width: number, height: number): Box[] {
  const margin = width * MARGIN;
  const w = nodeWidth(count, width); // misma fórmula que usa el parser para los límites de etiqueta
  const gap = w * GAP_RATIO;
  const h = height * NODE_H;
  const y = (height - h) / 2;
  return Array.from({ length: count }, (_, i) => ({ x: margin + i * (w + gap), y, w, h }));
}

/** Versión vertical (móvil): la misma fila con ancho y alto intercambiados, y luego traspuesta a columna. */
export function layoutStepsVertical(count: number, width: number, height: number): Box[] {
  return layoutSteps(count, height, width).map((b) => ({ x: b.y, y: b.x, w: b.h, h: b.w }));
}

/**
 * Parte una etiqueta en líneas que caben en `maxChars` (aproximación por número de caracteres,
 * suficiente para etiquetas de ≤ 24 caracteres). Una palabra más larga que la línea queda sola.
 */
export function wrapLabel(label: string, maxChars: number): string[] {
  const words = label.trim().split(/\s+/);
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    if (line && line.length + 1 + word.length > maxChars) {
      lines.push(line);
      line = word;
    } else {
      line = line ? `${line} ${word}` : word;
    }
  }
  if (line) lines.push(line);
  return lines;
}
