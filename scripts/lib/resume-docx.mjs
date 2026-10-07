import { Document, HeadingLevel, Packer, Paragraph, TabStopType, TextRun } from 'docx';
import { RESUME_LABELS, contactItems } from './resume-meta.mjs';

// Letter con márgenes de 0.5 in (twips): ancho útil 12240 − 2·720.
const PAGE = { width: 12240, height: 15840, margin: 720 };
const RIGHT_TAB = PAGE.width - 2 * PAGE.margin;

const heading = (text) => new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(text)] });
const bullet = (children) => new Paragraph({ bullet: { level: 0 }, children });
const entry = (left, right) =>
  new Paragraph({
    tabStops: [{ type: TabStopType.RIGHT, position: RIGHT_TAB }],
    children: [new TextRun({ text: left, bold: true }), new TextRun(`\t${right}`)],
  });

/** DOCX de una columna con estilos estándar de Word (Heading 1/2, viñetas): sin tablas ni cuadros de texto (ATS). */
export async function buildResumeDocx({ profile, text, locale, site, privateContact }) {
  const labels = RESUME_LABELS[locale];
  const contact = contactItems({ profile, site, privateContact }).map((c) => c.text).join('  ·  ');
  const children = [
    new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun(profile.name)] }),
    new Paragraph({ children: [new TextRun({ text: text.title, bold: true })] }),
    new Paragraph({ children: [new TextRun(contact)] }),
    heading(labels.sections.summary),
    new Paragraph({ children: [new TextRun(text.summary)] }),
    heading(labels.sections.skills),
    ...text.skills.map((s) => new Paragraph({ children: [new TextRun({ text: `${s.group}: `, bold: true }), new TextRun(s.items)] })),
    heading(labels.sections.experience),
    entry(`${text.experience.role} · ${text.experience.company}`, text.experience.dates),
    ...text.experience.bullets.map((b) => bullet([new TextRun(b)])),
    heading(labels.sections.projects),
    ...text.projects.map((p) => bullet([new TextRun({ text: p.name, bold: true }), new TextRun(` — ${p.text}`)])),
    heading(labels.sections.education),
    ...text.education.map((e) => entry(`${e.title} · ${e.institution}`, e.year)),
    heading(labels.sections.certifications),
    ...text.certifications.map((c) => entry(`${c.title} · ${c.issuer}`, c.year)),
  ];
  const doc = new Document({
    creator: profile.name,
    title: `${labels.resume} — ${profile.name}`,
    styles: { default: { document: { run: { font: 'Calibri', size: 21 } } } },
    sections: [
      {
        properties: {
          page: {
            size: { width: PAGE.width, height: PAGE.height },
            margin: { top: PAGE.margin, bottom: PAGE.margin, left: PAGE.margin, right: PAGE.margin },
          },
        },
        children,
      },
    ],
  });
  return Packer.toBuffer(doc);
}
