// Ayudas de presentación del tema glass. Solo reorganizan texto que ya viene de profile/cases; no inventan nada.

/**
 * Parte el titular en dos mitades por el espacio que deja las dos partes más parejas
 * ("Automation & AI engineer" / "who also builds products"). Con una sola palabra no parte.
 */
export function splitHeadline(text: string): [string, string] {
  const words = text.trim().split(/\s+/);
  if (words.length < 2) return [text.trim(), ''];
  let best = 1;
  let bestDiff = Infinity;
  for (let i = 1; i < words.length; i++) {
    const diff = Math.abs(words.slice(0, i).join(' ').length - words.slice(i).join(' ').length);
    if (diff < bestDiff) {
      bestDiff = diff;
      best = i;
    }
  }
  return [words.slice(0, best).join(' '), words.slice(best).join(' ')];
}

/**
 * Primera entrada de la experiencia del perfil ("- **Rol — Empresa** (periodo)") como una línea:
 * "Rol — Empresa · periodo". Devuelve null si el formato no coincide (la línea simplemente no se muestra).
 */
export function currentRole(experience: string): string | null {
  const m = /^\s*[-*]\s+\*\*(.+?)\*\*\s*(?:\(([^)]+)\))?/m.exec(experience);
  if (!m) return null;
  return m[2] ? `${m[1].trim()} · ${m[2].trim()}` : m[1].trim();
}

/** Etiqueta corta de una pestaña: lo que va antes de ":" en el título, o el título entero. */
export function shortTitle(title: string): string {
  const i = title.indexOf(':');
  return i > 0 ? title.slice(0, i).trim() : title;
}

/** Pila corta para el índice: los primeros `max` y "+N". */
export function shortStack(stack: string[], max = 5): string {
  return stack.length > max ? `${stack.slice(0, max).join(' · ')} · +${stack.length - max}` : stack.join(' · ');
}

/** 1 → "01" */
export function pad2(n: number): string {
  return String(n).padStart(2, '0');
}
