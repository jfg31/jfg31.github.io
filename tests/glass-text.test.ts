import { describe, it, expect } from 'vitest';
import { currentRole, pad2, shortStack, shortTitleOf, splitHeadline } from '../src/themes/glass/scripts/text';

describe('splitHeadline', () => {
  it('parte por el espacio que deja las dos mitades más parejas', () => {
    expect(splitHeadline('Automation & AI engineer who also builds products')).toEqual([
      'Automation & AI engineer',
      'who also builds products',
    ]);
  });

  it('con una sola palabra no parte', () => {
    expect(splitHeadline('  Engineer ')).toEqual(['Engineer', '']);
  });

  it('en empate se queda con el primer corte', () => {
    // "aa" | "bb cc" y "aa bb" | "cc" difieren en 3 caracteres: gana el primero
    expect(splitHeadline('aa bb cc')).toEqual(['aa', 'bb cc']);
  });

  it('normaliza espacios repetidos', () => {
    expect(splitHeadline('one   two')).toEqual(['one', 'two']);
  });
});

describe('currentRole', () => {
  it('toma la primera viñeta en negrita con su periodo', () => {
    const md = 'Intro paragraph.\n\n- **Role — Company** (2024–present)\n  - detail\n- **Older role** (2020–2023)';
    expect(currentRole(md)).toBe('Role — Company · 2024–present');
  });

  it('sin periodo devuelve solo el rol', () => {
    expect(currentRole('- **Role — Company**: did things')).toBe('Role — Company');
  });

  it('acepta viñetas con asterisco', () => {
    expect(currentRole('* **Role** (2022)')).toBe('Role · 2022');
  });

  it('sin viñeta en negrita devuelve null (la línea no se muestra)', () => {
    expect(currentRole('Just prose, no list.')).toBeNull();
    expect(currentRole('- plain bullet without bold')).toBeNull();
    expect(currentRole('')).toBeNull();
  });
});

describe('shortTitleOf', () => {
  const text = (title: string, shortTitle?: string) => ({ title, summary: '', problem: '', solution: '', outcome: '', ...(shortTitle ? { shortTitle } : {}) });

  it('usa el título corto del idioma pedido', () => {
    const item = { text: { en: text('Local AI assistant over documents', 'Local AI assistant'), es: text('Asistente de IA local', 'Asistente local') } };
    expect(shortTitleOf(item, 'en')).toBe('Local AI assistant');
    expect(shortTitleOf(item, 'es')).toBe('Asistente local');
  });

  it('sin título corto devuelve el título entero, sin recortar', () => {
    const item = { text: { en: text('Homelab: always-on Docker server'), es: text('Homelab: servidor siempre activo') } };
    expect(shortTitleOf(item, 'en')).toBe('Homelab: always-on Docker server');
  });
});

describe('shortStack', () => {
  const stack = ['a', 'b', 'c', 'd', 'e', 'f', 'g'];

  it('en el límite exacto no añade "+N"', () => {
    expect(shortStack(stack.slice(0, 5))).toBe('a · b · c · d · e');
  });

  it('por encima del límite corta y cuenta el resto', () => {
    expect(shortStack(stack.slice(0, 6))).toBe('a · b · c · d · e · +1');
    expect(shortStack(stack, 3)).toBe('a · b · c · +4');
  });

  it('vacío da cadena vacía', () => {
    expect(shortStack([])).toBe('');
  });
});

describe('pad2', () => {
  it('rellena a dos cifras sin truncar', () => {
    expect(pad2(1)).toBe('01');
    expect(pad2(12)).toBe('12');
    expect(pad2(120)).toBe('120');
  });
});
