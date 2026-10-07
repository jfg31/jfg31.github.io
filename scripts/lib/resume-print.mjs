import { extractText, getDocumentProxy } from 'unpdf';

const normalize = (text) => text.normalize('NFKC').replace(/\s+/g, ' ').trim();

/** Reglas del PDF publicado: exactamente 1 página y texto real (lo que lee un ATS). */
export function checkPdf({ totalPages, text }, { file, mustContain }) {
  const problems = [];
  if (totalPages !== 1) problems.push(`${file}: tiene ${totalPages} páginas (debe caber en 1)`);
  const flat = normalize(text);
  for (const needle of mustContain) {
    if (!flat.includes(normalize(needle))) problems.push(`${file}: el texto extraído no contiene «${needle}»`);
  }
  return problems;
}

export async function readPdf(buffer) {
  const pdf = await getDocumentProxy(new Uint8Array(buffer));
  const { totalPages, text } = await extractText(pdf, { mergePages: true });
  return { totalPages, text };
}

/** Imprime una página a PDF (Letter, según @page). `contact` reemplaza la línea de contacto (solo versión privada). */
export async function printPage(browser, url, { contact } = {}) {
  const page = await browser.newPage();
  try {
    await page.goto(url, { waitUntil: 'networkidle' });
    if (contact) {
      await page.evaluate((items) => {
        const list = document.querySelector('[data-resume-contact]');
        if (!list) throw new Error('falta [data-resume-contact] en la página del resume');
        list.replaceChildren(
          ...items.map(({ text, href }) => {
            const li = document.createElement('li');
            if (href) {
              const a = document.createElement('a');
              a.href = href;
              a.textContent = text;
              li.append(a);
            } else {
              li.textContent = text;
            }
            return li;
          }),
        );
      }, contact);
    }
    await page.evaluate(() => document.fonts.ready);
    return await page.pdf({ preferCSSPageSize: true, printBackground: false });
  } finally {
    await page.close();
  }
}
