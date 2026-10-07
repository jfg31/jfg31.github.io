# CLAUDE.md — portfolio-site

Sitio público de portfolio de Jose Flores (`jfg31.github.io`), generado desde el documento maestro privado en el cerebro (`second-brain/02 - Areas/Career/Portfolio/`). Spec y planes: `docs/superpowers/` (solo locales, en `.gitignore` — contienen nombres y rutas internas).

> ⚠️ **Este repo es público.** Nunca escribir aquí IPs reales, dominios internos, datos del empleador, nombres de compañeros ni credenciales. La fuente de verdad es el cerebro; `content/` se genera, no se edita a mano.

Este repo NO usa el hook de auto-commit/push del template: es público y cada push despliega.

## Antes de trabajar

Lee, en este orden, todos los archivos en `docs/`:
1. `docs/OVERVIEW.md` — idea, propósito, para quién es.
2. `docs/ARCHITECTURE.md` — estructura del código, decisiones técnicas.
3. `docs/STATUS.md` — en qué paso está el proyecto ahora mismo.
4. `docs/TODO.md` — qué falta por hacer.
5. `docs/IMPROVEMENTS.md` — mejoras futuras no urgentes (solo si es relevante a la tarea).

## Después de cada tarea

- Actualiza `docs/STATUS.md` con lo que se hizo y en qué quedó el proyecto.
- Actualiza `docs/TODO.md`: marca lo completado, agrega lo nuevo que haya surgido.
- Si la tarea fue grande o tocó dependencias, sigue las reglas de `~/.claude/rules/code-review.md` (review con `ecc:code-reviewer`/`ecc:security-reviewer` antes de dar la tarea por terminada).

## Comandos de desarrollo

- `pnpm export` — regenera `content/` desde el cerebro (requiere `.env.local`, ver `.env.example`)
- `pnpm lint:privacy` — busca datos sensibles en todo el repo (bloquea el push vía `.githooks/pre-push`)
- `pnpm test` — tests (Vitest)
- `pnpm dev` — servidor local en :4321
- `pnpm build` — build + DOCX/PDF del resume (Chromium) + verificación de contrato
- `pnpm release:check` — todo lo anterior en orden, antes de publicar
- Primer setup en una máquina nueva: `pnpm install && pnpm exec playwright-core install chromium && git config core.hooksPath .githooks && cp .env.example .env.local`

## Estructura

- `content/` — JSON generado por `pnpm export`. **No editar a mano.**
- `scripts/` — export, linter de privacidad, verificador de contrato; `scripts/lib/cli.mjs` expone `isMain` (guarda de CLI robusta ante symlinks/junctions)
- `src/themes/contract.ts` — contrato data ↔ tema
- `src/themes/<tema>/` — un tema (exporta HomePage, ProjectsPage, CasePage, AboutPage); `tokens.css` para retoques
- `portfolio.config.mjs` — tema activo (una línea)
- `src/i18n/ui.ts` — textos de interfaz EN/ES
- `src/pages/[lang]/` — rutas; no contienen presentación, solo pasan data al tema
