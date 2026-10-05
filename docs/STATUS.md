# Estado actual — portfolio-site

## Último update

2026-10-05

## En qué paso está

Publicado en https://jfg31.github.io con el tema `base`. En la rama `feat/glass-theme` el sitio ya usa el tema `glass` ("Liquid Glass", Plan C), activado en `portfolio.config.mjs` y con `pnpm release:check` en verde. Falta que Jose lo vea en local y dé el visto bueno para hacer push (push a `main` = deploy).

## Qué se hizo en la última sesión

- Plan C completo en la rama: diagramas como datos (parser + validación en el export), textos de interfaz nuevos, `pnpm check` (`astro check`) en CI, `PORTFOLIO_THEME` para construir cualquier tema, y el tema `glass` (controles flotantes, lente de vidrio sobre los diagramas, pestañas de trabajo destacado, páginas de caso y "sobre mí").
- Pulido final: curvas y tiempos unificados en tokens, respuesta al presionar, hover solo con puntero fino, física de la lente independiente de la tasa de refresco, recorrido del hero ≤ 5 s, `theme-color`, foco nunca tapado por la barra flotante.
- Accesibilidad: roles de pestañas solo con JS, figura del diagrama enfocable solo con la lente, barra flotante con nombre propio, pista del diagrama que menciona las flechas.
- Tests de las ayudas de texto del tema glass.

## Próximos pasos inmediatos

- Revisión de Jose en local (`pnpm dev`): EN/ES, claro/oscuro/sistema, escritorio y móvil. Con su sí, push a `main`.
- Resolver los pendientes de confirmar con Jose (ver `docs/TODO.md`).
- Después: resume, LinkedIn y perfil de GitHub desde el documento maestro.
