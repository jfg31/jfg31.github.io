# Arquitectura — portfolio-site

## Flujo de datos

```
Cerebro (privado)                     Repo del sitio (público)
Casos/*.md + Perfil.md + Resume.md
      │
      ▼
scripts/export.mjs ──► content/profile.json, content/cases/*.json, content/resume.json
  · solo casos con publico: true
  · solo frontmatter seguro + secciones públicas ES/EN
  · Resume.md: solo las secciones públicas ES/EN (nunca "## Privado")
      │
      ▼
scripts/privacy-lint.mjs ──► falla si encuentra datos sensibles
  · patrones genéricos (IPs privadas, emails, tokens/keys)
  · lista de bloqueo leída desde el cerebro (ruta vía variable de entorno), NUNCA versionada
      │
      ▼
astro build ──► dist/ ──► GitHub Pages
      │
      ▼ (post-build, dentro de `pnpm build`)
resume-docx.mjs + resume-pdf.mjs ──► dist/resume/*.docx, *.pdf
scripts/check-contract.mjs ──► verifica páginas, casos y archivos del resume
```

- `export.mjs` y `privacy-lint.mjs` corren **localmente** (la máquina de desarrollo tiene acceso al cerebro). El repo público solo recibe `content/*.json` ya filtrado.
- El linter revisa **todo el repo** (archivos versionados y no ignorados, incluido `docs/`). Localmente usa patrones genéricos + lista privada; en CI (`CI=true`) solo patrones genéricos, enmascarando coincidencias en el log. El hook `.githooks/pre-push` lo corre antes de cada push.
- `pnpm build` necesita Chromium (`playwright-core`) para imprimir los PDF del resume: `pnpm exec playwright-core install chromium` (el deploy en CI lo instala).
- Antes de publicar por primera vez se revisa también todo el historial de git (`git log -p --all | pnpm lint:privacy --stdin`).

## Estructura de carpetas

```
portfolio-site/
├── content/              ← DATA generada por `pnpm export`, nunca se edita a mano
│   ├── profile.json
│   ├── resume.json
│   └── cases/*.json
├── scripts/              ← export, linter de privacidad, verificador de contrato, generadores DOCX/PDF del resume
│   └── lib/              ← parsers y utilidades (cli.mjs expone isMain: guarda de CLI segura con symlinks/junctions)
├── src/
│   ├── i18n/ui.ts        ← textos de interfaz EN/ES
│   ├── lib/              ← carga de data, filtrado, orden por "destacado", markdown, resume
│   ├── pages/[lang]/     ← rutas; solo pasan data al tema, sin presentación (incluye resume/[variant])
│   ├── resume/           ← ResumeDocument.astro + resume.css: página del resume, independiente del tema
│   └── themes/
│       ├── contract.ts   ← tipos del contrato data ↔ tema (Profile, Case, DiagramStep, UiStrings, props de página)
│       ├── base/         ← tema mínimo funcional (HomePage, ProjectsPage, CasePage, AboutPage, tokens.css)
│       └── glass/        ← tema activo "Liquid Glass" (ver más abajo)
├── tests/                ← Vitest
├── .githooks/            ← pre-push (lint de privacidad)
├── .github/workflows/    ← deploy a GitHub Pages
└── portfolio.config.mjs  ← tema activo (una línea)
```

## Stack técnico

- Astro (sitio estático, i18n EN/ES) + TypeScript.
- marked para renderizar el markdown de las secciones públicas (contenido propio y confiable, procedente del cerebro).
- Vitest para tests; pnpm como gestor de paquetes.
- Deploy: GitHub Actions → GitHub Pages (sitio de usuario, sin `base`).

## Decisiones técnicas clave

- **Separación data / presentación.** La data se genera aparte y los temas solo la consumen mediante un contrato tipado; cambiar de estilo nunca toca data, i18n, export, linter ni deploy.
- **El cerebro es la fuente de verdad.** El repo no contiene datos editables a mano; `content/` es un derivado reproducible.
- **Privacidad en capas.** Export filtrado, linter local con lista privada, hook pre-push, linter genérico en CI y revisión del historial antes de publicar.
- **`pnpm build` valida el contrato.** Tras `astro build`, `scripts/check-contract.mjs` verifica que existan todas las páginas por idioma y que cada caso público aparezca con su título.
- **`pnpm check` hace type-check de los temas.** Corre `astro check` (TypeScript + plantillas `.astro`) sobre todos los temas, no solo el activo; CI lo corre antes del build y `pnpm release:check` también.
- **`PORTFOLIO_THEME` para probar otro tema sin activarlo.** `astro.config.mjs` usa `process.env.PORTFOLIO_THEME` si existe y, si no, el `theme` de `portfolio.config.mjs`. Ejemplo: `PORTFOLIO_THEME=base pnpm build` construye (y verifica el contrato de) el tema `base` sin tocar la configuración. El deploy siempre usa `portfolio.config.mjs`.

## Cómo crear un tema nuevo

1. Copiar `src/themes/base/` a `src/themes/<nuevo>/`.
2. Ajustar layouts, componentes y `tokens.css`. El tema debe exportar `HomePage`, `ProjectsPage`, `CasePage` y `AboutPage` desde su `index.ts`, con las props definidas en `src/themes/contract.ts`.
3. Cambiar `theme` en `portfolio.config.mjs` a `<nuevo>`.
4. Correr `pnpm build`: valida el contrato de tema contra el sitio generado.

Para un retoque menor basta con editar `tokens.css` del tema activo (colores, tipografía, espaciado como variables CSS).

## Diagramas como datos

Un caso puede llevar un diagrama de pasos (opcional). No es una imagen: es una lista en el documento del caso en el cerebro, que `pnpm export` valida y guarda en `content/cases/<slug>.json` como `diagram: { es: DiagramStep[], en: DiagramStep[] }` (`DiagramStep = { label, detail }`). El tema decide cómo dibujarlo.

### Formato en el vault

Dentro de la sección pública de cada idioma, una subsección `###` con una lista numerada:

```markdown
## Versión pública (ES)
...
### Diagrama
1. **Documentos** — PDF, Word y Excel, con OCR para escaneados.
2. **Búsqueda** — Semántica más palabras clave.
3. **Respuesta** — En español o inglés, con enlaces a las fuentes.

## Public version (EN)
...
### Diagram
1. **Documents** — PDF, Word and Excel, with OCR for scanned files.
2. **Search** — Semantic plus keyword matching.
3. **Answer** — In Spanish or English, with links to the sources.
```

### Reglas (las aplica `scripts/lib/diagram.mjs`; si falla, el export se detiene con el archivo y el motivo)

- Cada línea: `N. **Etiqueta** — detalle`, con raya «—» (U+2014) y un espacio a cada lado.
- De 2 a 6 pasos.
- Etiqueta no vacía y de 24 caracteres como máximo; detalle no vacío y de 120 como máximo.
- Si existe en un idioma, debe existir en el otro, y los dos con el mismo número de pasos.
- Sin la subsección en ningún idioma, el caso simplemente no tiene diagrama (la página del caso usa filas etiqueta | texto).

## Título corto (opcional)

Un caso puede llevar un título corto para las pastillas del inicio y las pestañas de trabajo destacado. En el vault es una subsección más de cada sección pública, justo después del título:

```markdown
## Versión pública (ES)
### Título
Asistente de IA local sobre documentos internos
### Título corto
Asistente de IA local
...
## Public version (EN)
### Title
Local AI assistant over internal documents
### Short title
Local AI assistant
```

Reglas (las aplica `scripts/lib/case.mjs`; si falla, el export se detiene con el archivo y el motivo): texto plano en una línea (sin markdown ni etiquetas), no vacío, de 24 caracteres como máximo; si existe en un idioma, debe existir en el otro. Se guarda como `text[locale].shortTitle` y se omite si no existe. El tema glass usa `shortTitleOf(item, locale)` (`scripts/text.ts`): el título corto o, si falta, el título completo.

## Resume

Cuatro resumes de 1 página: dos versiones (`ai` = Automatización e IA, `fullstack`) en dos idiomas.

### Flujo

```
Resume.md (cerebro) ──pnpm export──► content/resume.json
   ──astro build──► /<lang>/resume/<ia|ai|fullstack>/   (HTML; también es la fuente del PDF)
   ──post-build──► scripts/resume-docx.mjs → dist/resume/*.docx
                   scripts/resume-pdf.mjs  → dist/resume/*.pdf (Chromium imprime la página servida con astro preview)
   ──────────────► scripts/check-contract.mjs (páginas, enlaces y archivos presentes)
```

URLs: `en/resume/ai`, `en/resume/fullstack`, `es/resume/ia`, `es/resume/fullstack`. `src/lib/resume.ts` carga el JSON y `src/pages/[lang]/resume/[variant].astro` solo pasa data a `src/resume/ResumeDocument.astro`.

### Formato en el vault (`Resume.md`)

Frontmatter con `actualizado` y dos secciones públicas (`## Versión pública (ES)` y `## Public version (EN)`) con las mismas subsecciones `###`. Ejemplo mínimo con texto ficticio (la sección EN; la ES usa Título, Resumen, Habilidades, Experiencia, Proyectos, Educación, Certificaciones):

```markdown
---
actualizado: 2026-10-06
---
## Public version (EN)
### Title [ia]
Automation & AI Engineer
### Title [fullstack]
Full-Stack Engineer
### Summary [ia]
Builds automations and local AI tools for Acme.
### Summary [fullstack]
Builds web apps end to end for Acme.
### Skills
- [ia] **Automation:** n8n, Python
- [ia, fullstack] **Web:** TypeScript, Astro
### Experience
Engineer | Acme | 2024 – Present
- [ia] Automated a reporting flow for Acme.
- [fullstack] Shipped an internal dashboard for Acme.
- [ia, fullstack] Reduced manual work with scripts.
### Projects
- [ia] **Doc assistant** (example-slug) — Local AI over documents.
### Education
BSc Computer Science | Example University | 2024
### Certifications
Example Certificate | Example Issuer | 2025
## Privado
- Teléfono: …
- Ciudad: …
```

### Etiquetas

Cada ítem de habilidades, bullet de experiencia y proyecto empieza con `- [ia]`, `- [fullstack]` o `- [ia, fullstack]` (en ambos idiomas). Título y resumen llevan la etiqueta en el encabezado (`### Title [ia]`). La línea de experiencia (puesto | empresa | fechas), la educación y las certificaciones son comunes a las dos versiones.

### Reglas y límites (las aplica `scripts/lib/resume.mjs`; si falla, el export se detiene con el archivo y el motivo)

- Experiencia: 3 a 5 bullets por versión. Proyectos: 2 a 3. Habilidades: 3 a 4 grupos.
- Bullet (experiencia, proyecto, habilidades) ≤ 220 caracteres; resumen ≤ 400; título ≤ 60; campos de las líneas `a | b | c` ≤ 120. Todo texto plano (sin markdown ni etiquetas) y sin wikilinks.
- ES y EN deben tener el mismo número de bullets, proyectos, grupos de habilidades, líneas de educación y certificaciones.
- El `slug` de cada proyecto debe ser un caso público y el mismo, en la misma posición, en ES y EN.

### Archivos generados

`dist/resume/JoseFlores-Resume-<AI|FullStack>-<EN|ES>.pdf` y `.docx` (nombres de `resumeFileBase` en `scripts/lib/resume-meta.mjs`). Cada página del resume enlaza a su PDF y DOCX, y "sobre mí" enlaza a las cuatro versiones.

### Regla de 1 página

`resume-pdf.mjs` imprime cada página (tamaño según `@page`) y verifica con `unpdf` que el PDF tenga exactamente 1 página y que el texto extraído contenga el nombre y el título. Si no cabe, **el build falla**: acortar bullets en `Resume.md`.

### Independiente del tema

La página vive en `src/resume/` y no usa `@theme` ni los tokens de ningún tema: cambiar de tema no altera los resumes. Las etiquetas de interfaz (secciones, botones, nombres de versión) están en `RESUME_LABELS` (`scripts/lib/resume-meta.mjs`), compartidas por la página y el DOCX.

### Versión privada

`pnpm resume:private` (corre `pnpm build` y luego `scripts/resume-private.mjs`) lee `## Privado` de `Resume.md` (teléfono y ciudad), inyecta esos datos en la línea de contacto del DOM justo antes de imprimir el PDF y en el DOCX, y escribe los archivos `*-privado` en `"<PORTFOLIO_DIR>/Resume - archivos/"`. Rechaza cualquier salida dentro del repo. `## Privado` nunca se exporta (`parseResume` no lo lee): los resumes públicos solo muestran "Puerto Rico".

## Tema glass ("Liquid Glass")

Tema activo (`theme: 'glass'`). Contenido como papel liso; el vidrio solo va en la capa funcional (controles flotantes, barra de pestañas, selector de trabajo destacado y lente del diagrama).

- `tokens.css` — paleta clara/oscura, vidrio, curvas (`--ease-gel`, `--ease-out`, `--ease-drawer`) y tiempos (`--t-press`, `--t-hover`, `--t-morph`, `--t-theme`). Retoques rápidos aquí.
- `Layout.astro` — script inline anti-FOUC (tema `light|dark|system` guardado en `localStorage`, clases `js` y `motion`), controles de idioma y tema, barra flotante, banda de contacto.
- `HomePage.astro` — hero con una pastilla por caso destacado (título corto y categoría, bajo `ui.selectedProjects`); cada pastilla es un ancla `#work-<slug>`.
- `Diagram.astro` + `scripts/layout.ts` (geometría pura, con tests) + `scripts/lens.ts` (lente de vidrio): debajo del dibujo, la `<ol class="diagram-steps">` siempre visible con todos los pasos (número, etiqueta y detalle; una columna en contenedores < 720 px, dos a partir de ahí). La lente lee las posiciones del SVG generado y resalta la fila del paso bajo ella (`.is-on` + `aria-current="step"`) sin mover el layout. Teclado: ←/→, Inicio/Fin.
- `WorkTabs.astro` — trabajo destacado; los roles `tablist/tab/tabpanel` los pone el script (sin JS son secciones normales). Los paneles tienen id `work-<slug>`: un enlace con ese hash (las pastillas, una carga directa, atrás/adelante) abre la pestaña, desplaza hasta `#work` (sin animación con movimiento reducido) y enfoca la pestaña; cambiar de pestaña actualiza el hash con `history.replaceState`.
- `scripts/controls.ts` — barra flotante (scroll-spy, gota "gel", se encoge al bajar), luz especular y refracción del borde (solo Chromium).
- `scripts/text.ts` — ayudas de texto (titular partido, rol actual, pila corta), con tests.

Mejora progresiva: sin JS los diagramas se ven como listas con todos sus pasos y detalles (sin el dibujo), el trabajo destacado como secciones seguidas y las pastillas del hero saltan al panel de su caso; sin refracción SVG (Safari/Firefox) queda el blur; sin `backdrop-filter`, superficie sólida (`@supports`); con `prefers-reduced-motion: reduce`, sin transiciones y la lente fija.
