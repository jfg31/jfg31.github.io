// Límites del diagrama, en un solo lugar: los importan el parser (scripts/lib/diagram.mjs) y el tema glass
// (layout.ts y Diagram.astro). Así una etiqueta que el parser acepta siempre cabe en el nodo que se dibuja.

export const MIN_STEPS = 2;
export const MAX_STEPS = 6;
export const MAX_LABEL = 24;
export const MAX_DETAIL = 120;

// Geometría de los nodos (unidades del viewBox).
export const MARGIN = 0.04; // fracción del ancho
export const GAP_RATIO = 0.35; // separación relativa al ancho de un nodo
export const NODE_H = 0.46; // fracción del alto

// Dibujo de la etiqueta.
export const FONT = 17; // tamaño de la etiqueta
export const CHAR = 0.56; // ancho medio de un carácter, en em (aproximación)
export const PAD = 24; // relleno horizontal total dentro del nodo

// Vistas: fila (escritorio) y columna (móvil).
export const VIEW_H = { w: 1000, h: 200 };
export const VIEW_V = { w: 400 };

/** Ancho de un nodo en una fila de `count` nodos sobre `extent` unidades. */
export function nodeWidth(count, extent) {
  const usable = extent - extent * MARGIN * 2;
  return usable / (count + (count - 1) * GAP_RATIO);
}

/** Caracteres que caben en una línea de un nodo de ancho `width`. */
export function charsFit(width) {
  return Math.floor((width - PAD) / (FONT * CHAR));
}

/** Caracteres por línea con `count` pasos en la vista dada ('h' fila, 'v' columna). */
export function maxLineChars(count, orient) {
  return charsFit(orient === 'v' ? VIEW_V.w * NODE_H : nodeWidth(count, VIEW_H.w));
}

/** Palabra más larga que cabe sin recortarse, en las dos vistas, con `count` pasos. */
export function maxWordLength(count) {
  return Math.min(MAX_LABEL, maxLineChars(count, 'h'), maxLineChars(count, 'v'));
}
