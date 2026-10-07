import { describe, it, expect } from 'vitest';
import JSZip from 'jszip';
import { buildResumeDocx } from '../scripts/lib/resume-docx.mjs';

const profile = { name: 'Jose Flores', email: 'jfloresgandara31@gmail.com', github: 'jfg31', linkedin: '' };
const site = 'https://jfg31.github.io';
const text = {
  title: 'Automation & AI Engineer',
  summary: 'Builds local AI.',
  skills: [{ group: 'AI', items: 'n8n, Ollama' }],
  experience: { role: 'Developer', company: 'Helvetia del Caribe', dates: 'Apr 2021 – Present', bullets: ['Built a suite of 16+ workflows.'] },
  projects: [{ name: 'Homelab', slug: 'homelab', text: 'Self-hosted server.' }],
  education: [{ title: 'B.S. Computer Science', institution: 'UPRB', year: '2021' }],
  certifications: [{ title: 'Microsoft Office Specialist: Excel', issuer: 'Microsoft', year: '2020' }],
};

async function documentXml(buffer) {
  const zip = await JSZip.loadAsync(buffer);
  return zip.file('word/document.xml').async('string');
}

describe('buildResumeDocx', () => {
  it('incluye nombre, título, secciones y bullets, sin tablas', async () => {
    const xml = await documentXml(await buildResumeDocx({ profile, text, locale: 'en', site }));
    for (const s of ['Jose Flores', 'Automation &amp; AI Engineer', 'Experience', 'Built a suite of 16+ workflows.', 'Homelab', 'jfg31.github.io', 'Microsoft Office Specialist: Excel']) {
      expect(xml).toContain(s);
    }
    expect(xml).not.toContain('<w:tbl');
    expect(xml).toContain('Heading1');
  });

  it('usa las etiquetas del idioma', async () => {
    const xml = await documentXml(await buildResumeDocx({ profile, text, locale: 'es', site }));
    expect(xml).toContain('Experiencia');
    expect(xml).toContain('Certificaciones');
  });

  it('solo incluye el teléfono en la versión privada', async () => {
    const pub = await documentXml(await buildResumeDocx({ profile, text, locale: 'en', site }));
    expect(pub).not.toContain('555-0199');
    const priv = await documentXml(await buildResumeDocx({ profile, text, locale: 'en', site, privateContact: { phone: '(787) 555-0199', city: 'Bayamón' } }));
    expect(priv).toContain('(787) 555-0199');
    expect(priv).toContain('Bayamón, Puerto Rico');
  });
});
