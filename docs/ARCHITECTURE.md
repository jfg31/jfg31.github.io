# Arquitectura — portfolio-site

## Flujo de datos

```
Cerebro (privado)                     Repo del sitio (público)
Casos/*.md + Perfil.md
      │
      ▼
scripts/export.mjs ──► content/profile.json, content/cases/*.json
  · solo casos con publico: true
  · solo frontmatter seguro + secciones públicas ES/EN
      │
      ▼
scripts/privacy-lint.mjs ──► falla si encuentra datos sensibles
  · patrones genéricos (IPs privadas, emails, tokens/keys)
  · lista de bloqueo leída desde el cerebro (ruta vía variable de entorno), NUNCA versionada
      │
      ▼
astro build ──► dist/ ──► GitHub Pages
```

- `export.mjs` y `privacy-lint.mjs` corren **localmente** (la máquina de desarrollo tiene acceso al cerebro). El repo público solo recibe `content/*.json` ya filtrado.
- El linter revisa **todo el repo** (archivos versionados y no ignorados, incluido `docs/`). Localmente usa patrones genéricos + lista privada; en CI (`CI=true`) solo patrones genéricos, enmascarando coincidencias en el log. El hook `.githooks/pre-push` lo corre antes de cada push.
- Antes de publicar por primera vez se revisa también todo el historial de git (`git log -p --all | pnpm lint:privacy --stdin`).

## Estructura de carpetas

```
portfolio-site/
├── content/              ← DATA generada por `pnpm export`, nunca se edita a mano
│   ├── profile.json
│   └── cases/*.json
├── scripts/              ← export, linter de privacidad, verificador de contrato
│   └── lib/              ← parsers y utilidades (cli.mjs expone isMain: guarda de CLI segura con symlinks/junctions)
├── src/
│   ├── i18n/ui.ts        ← textos de interfaz EN/ES
│   ├── lib/              ← carga de data, filtrado, orden por "destacado", markdown
│   ├── pages/[lang]/     ← rutas; solo pasan data al tema, sin presentación
│   └── themes/
│       ├── contract.ts   ← tipos del contrato data ↔ tema (Profile, Case, Locale, props de página)
│       └── base/         ← tema mínimo funcional (HomePage, ProjectsPage, CasePage, AboutPage, tokens.css)
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

## Cómo crear un tema nuevo

1. Copiar `src/themes/base/` a `src/themes/<nuevo>/`.
2. Ajustar layouts, componentes y `tokens.css`. El tema debe exportar `HomePage`, `ProjectsPage`, `CasePage` y `AboutPage` desde su `index.ts`, con las props definidas en `src/themes/contract.ts`.
3. Cambiar `theme` en `portfolio.config.mjs` a `<nuevo>`.
4. Correr `pnpm build`: valida el contrato de tema contra el sitio generado.

Para un retoque menor basta con editar `tokens.css` del tema activo (colores, tipografía, espaciado como variables CSS).
