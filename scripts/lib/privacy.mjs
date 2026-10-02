export const ALLOWED_EMAILS = ['jfloresgandara31@gmail.com', 'noreply@anthropic.com'];

export const GENERIC_RULES = [
  { id: 'ip-privada', re: /\b(?:10\.\d{1,3}|127\.\d{1,3}|192\.168|172\.(?:1[6-9]|2\d|3[01]))\.\d{1,3}\.\d{1,3}\b/g },
  { id: 'email', re: /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g },
  { id: 'token', re: /\b(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{30,}|sk-(?:ant-)?[A-Za-z0-9_-]{20,}|AKIA[0-9A-Z]{16}|xox[abpr]-[A-Za-z0-9-]{10,})/g },
  { id: 'token-telegram', re: /\b\d{8,10}:[A-Za-z0-9_-]{35}\b/g },
  { id: 'llave-privada', re: /-----BEGIN [A-Z ]*PRIVATE KEY-----/g },
  { id: 'dominio-local', re: /\b[a-z0-9-]+\.(?:lan|internal|home\.arpa)\b/gi },
];

export function parseBlocklist(markdown) {
  return markdown
    .replace(/\r\n/g, '\n')
    .split('\n')
    .filter((line) => line.startsWith('- '))
    .map((line) => line.slice(2).trim())
    .filter((term) => term.length >= 3);
}

export function findViolations(text, { blocklist = [], allowedEmails = ALLOWED_EMAILS } = {}) {
  const violations = [];
  for (const { id, re } of GENERIC_RULES) {
    for (const match of text.matchAll(re)) {
      if (id === 'email' && allowedEmails.includes(match[0].toLowerCase())) continue;
      violations.push({ rule: id, match: match[0] });
    }
  }
  const lower = text.toLowerCase();
  for (const term of blocklist) {
    if (lower.includes(term.toLowerCase())) violations.push({ rule: 'lista-de-bloqueo', match: term });
  }
  return violations;
}

export function assertBlocklistUsable(terms, path) {
  if (terms.length === 0) {
    throw new Error(`La lista de bloqueo (${path}) no tiene términos válidos (líneas "- término"). Revisar el formato; sin ella el linter queda ciego.`);
  }
}
