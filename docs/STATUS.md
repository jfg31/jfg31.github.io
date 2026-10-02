# Estado actual — portfolio-site

## Último update

2026-10-02

## En qué paso está

Plan B completado: pipeline del sitio listo (export desde el cerebro, linter de privacidad, tema base, build con verificación de contrato) y workflow de deploy a GitHub Pages escrito. Falta publicar: crear el repo público `jfg31.github.io`, el primer push y activar Pages (requiere confirmación explícita de Jose). El diseño visual (Plan C) está pendiente; por ahora el sitio usa el tema `base`.

## Qué se hizo en la última sesión

- Workflow `.github/workflows/deploy.yml` (lint de privacidad, tests, build y deploy a Pages). Permisos: `contents: read` a nivel global; `pages: write` e `id-token: write` solo en el job de deploy. `pnpm/action-setup` está fijado al SHA del commit (v6.0.10); el resto de actions usa tags de versión mayor.
- Documentación del proyecto: comandos, estructura y arquitectura (flujo de datos y cómo crear un tema).
- Verificación completa con `pnpm release:check`.

## Próximos pasos inmediatos

- Revisión de seguridad del repo y del historial antes de publicar.
- Publicación: repo público, primer push y activación de Pages.
- Plan C: diseño del sitio (nuevo tema).
- Resolver los pendientes de confirmar con Jose (ver `docs/TODO.md`).
