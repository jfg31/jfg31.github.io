import { describe, it, expect } from 'vitest';
import { findViolations, parseBlocklist } from '../scripts/lib/privacy.mjs';

// Strings sensibles construidos dinámicamente para que el linter no marque este archivo.
const ip = (...parts) => parts.join('.');
const at = (user, domain) => `${user}@${domain}`;

const rules = (text, opts) => findViolations(text, opts).map((v) => v.rule);

describe('findViolations — patrones genéricos', () => {
  it.each([
    ip('192', '168', '0', '50'),
    ip('10', '1', '2', '3'),
    ip('172', '20', '0', '1'),
    ip('127', '0', '0', '1'),
  ])('detecta IP privada %s', (value) => {
    expect(rules(`host ${value} aquí`)).toContain('ip-privada');
  });

  it('permite IPs de documentación (RFC 5737) y públicas', () => {
    expect(rules(`diagrama ${ip('192', '0', '2', '10')} y ${ip('8', '8', '8', '8')}`)).toEqual([]);
  });

  it('detecta emails no permitidos y permite los de la allowlist', () => {
    expect(rules(`escribe a ${at('alguien', 'empresa.com')}`)).toEqual(['email']);
    expect(rules(`contacto ${at('jfloresgandara31', 'gmail.com')}`)).toEqual([]);
    expect(rules(at('noreply', 'anthropic.com'))).toEqual([]);
  });

  it('detecta tokens y llaves', () => {
    const gh = 'ghp' + '_' + 'a'.repeat(36);
    const sk = 'sk' + '-ant-' + 'b'.repeat(30);
    const aws = 'AKIA' + 'ABCDEFGHIJKLMNOP';
    const telegram = '123456789' + ':' + 'A'.repeat(35);
    const pem = '-----BEGIN ' + 'OPENSSH PRIVATE KEY-----';
    expect(rules(gh)).toContain('token');
    expect(rules(sk)).toContain('token');
    expect(rules(aws)).toContain('token');
    expect(rules(telegram)).toContain('token-telegram');
    expect(rules(pem)).toContain('llave-privada');
  });

  it('detecta dominios de red local', () => {
    expect(rules('abre nas' + '.lan')).toContain('dominio-local');
    expect(rules('router' + '.home.arpa')).toContain('dominio-local');
  });

  it('no marca .env.local ni texto normal', () => {
    expect(rules('copiar .env.example a .env.local; versión 7.3.5 de Astro')).toEqual([]);
  });
});

describe('lista de bloqueo', () => {
  it('parsea líneas "- término" ignorando el resto y términos muy cortos', () => {
    const md = '---\ntags: [x]\n---\n# Lista\nTexto\n- servidorsecreto\n-  Persona Ficticia \n- ab\n* no';
    expect(parseBlocklist(md)).toEqual(['servidorsecreto', 'Persona Ficticia']);
  });

  it('detecta términos sin importar mayúsculas', () => {
    const v = findViolations('Lo hizo PERSONA ficticia en servidorSecreto', { blocklist: ['Persona Ficticia', 'servidorsecreto'] });
    expect(v.map((x) => x.match)).toEqual(['Persona Ficticia', 'servidorsecreto']);
    expect(v.every((x) => x.rule === 'lista-de-bloqueo')).toBe(true);
  });
});
