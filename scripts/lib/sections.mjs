function toLines(text) {
  return text.replace(/\r\n/g, '\n').split('\n');
}

export function extractSection(markdown, heading) {
  const lines = toLines(markdown);
  const start = lines.findIndex((line) => line.trim() === `## ${heading}`);
  if (start === -1) return null;
  const body = [];
  for (let i = start + 1; i < lines.length; i++) {
    if (/^## /.test(lines[i])) break;
    body.push(lines[i]);
  }
  return body.join('\n').trim();
}

export function extractSubsections(sectionText, names) {
  const buffers = {};
  let current = null;
  for (const line of toLines(sectionText)) {
    const heading = /^### (.+?)\s*$/.exec(line);
    if (heading) {
      current = names.includes(heading[1]) ? heading[1] : null;
      if (current) buffers[current] = [];
      continue;
    }
    if (current) buffers[current].push(line);
  }
  return Object.fromEntries(names.map((name) => [name, buffers[name] ? buffers[name].join('\n').trim() : null]));
}
