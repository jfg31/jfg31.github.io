import { marked } from 'marked';

// El contenido viene del cerebro de Jose (fuente confiable) y ya pasó por el linter de privacidad.
export function md(text: string): string {
  return marked.parse(text, { async: false }) as string;
}
