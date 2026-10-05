// Geometría pura del diagrama del tema glass (sin DOM: se usa en el build de Astro y en los tests).

export interface Box { x: number; y: number; w: number; h: number }

const MARGIN = 0.04; // fracción del ancho
const GAP_RATIO = 0.35; // separación relativa al ancho de un nodo
const NODE_H = 0.46; // fracción del alto

/** Nodos en fila, centrados verticalmente, con márgenes y separación iguales. */
export function layoutSteps(count: number, width: number, height: number): Box[] {
  const margin = width * MARGIN;
  const usable = width - margin * 2;
  const w = usable / (count + (count - 1) * GAP_RATIO);
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
