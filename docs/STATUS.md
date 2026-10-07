# Estado actual — portfolio-site

## Último update

2026-10-06

## En qué paso está

Sitio publicado en https://jfg31.github.io con el tema `glass` ("Liquid Glass"), incluido el hero con pastillas de proyectos destacados (fusionado y en vivo). El resume (Plan D) está publicado (2026-10-06): `/en/resume/ai/`, `/en/resume/fullstack/`, `/es/resume/ia/`, `/es/resume/fullstack/`, con PDF y DOCX en `/resume/`.

## Qué se hizo en la última sesión

Resume (Plan D), publicado:

- 4 versiones de 1 página: Automatización e IA y Full-Stack, en EN y ES, derivadas de `Resume.md` en el cerebro (`pnpm export` → `content/resume.json`).
- Página web por versión (`/<lang>/resume/<ia|ai|fullstack>/`), independiente del tema, con descarga en PDF (Chromium; la regla de 1 página rompe el build) y DOCX.
- Versión privada local (`pnpm resume:private`): teléfono y ciudad desde `## Privado`, salida fuera del repo, nunca publicada.
- `check-contract` verifica páginas, enlaces y archivos del resume; `docs/ARCHITECTURE.md` documenta el pipeline.

Sesiones anteriores: tema `glass` (Plan C), diagramas como datos, títulos cortos, pastillas del hero y listas de pasos visibles bajo los diagramas.

## Próximos pasos inmediatos

- Derivar LinkedIn desde el documento maestro; luego el perfil de GitHub.
- Después: LinkedIn y perfil de GitHub desde el documento maestro.
- Probar en Safari/iPhone y Firefox reales (solo Jose).
- Resolver los pendientes de confirmar con Jose (ver `docs/TODO.md`).
