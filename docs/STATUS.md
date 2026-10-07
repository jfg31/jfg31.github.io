# Estado actual — portfolio-site

## Último update

2026-10-06

## En qué paso está

Publicado en https://jfg31.github.io con el tema `glass` ("Liquid Glass", Plan C), aprobado por Jose el 2026-10-06. El tema `base` sigue disponible como respaldo (`PORTFOLIO_THEME=base`).

## Qué se hizo en la última sesión

Rama `feat/hero-projects` (sin push, pendiente de revisión de Jose):

- Título corto opcional por caso (`### Título corto` / `### Short title`, ≤ 24 caracteres, texto plano, en ambos idiomas), validado en el export y añadido a los 5 casos destacados y a la plantilla del vault.
- Hero: el diagrama "cómo se hace este sitio" se sustituye por pastillas de los proyectos destacados que abren su pestaña en Trabajo (`#work-<slug>`, también sin JS y con carga directa del hash).
- Pestañas de trabajo destacado con el título corto, sin recorte con "…".
- Diagramas: lista de pasos siempre visible bajo el dibujo; la lente resalta la fila del paso (sustituye el pie de un solo detalle). Se quitó el recorrido automático de la lente (solo existía en el hero).

Sesión anterior:

- Plan C completo en la rama: diagramas como datos (parser + validación en el export), textos de interfaz nuevos, `pnpm check` (`astro check`) en CI, `PORTFOLIO_THEME` para construir cualquier tema, y el tema `glass` (controles flotantes, lente de vidrio sobre los diagramas, pestañas de trabajo destacado, páginas de caso y "sobre mí").
- Pulido final: curvas y tiempos unificados en tokens, respuesta al presionar, hover solo con puntero fino, física de la lente independiente de la tasa de refresco, recorrido del hero ≤ 5 s, `theme-color`, foco nunca tapado por la barra flotante.
- Accesibilidad: roles de pestañas solo con JS, figura del diagrama enfocable solo con la lente, barra flotante con nombre propio, pista del diagrama que menciona las flechas.
- Tests de las ayudas de texto del tema glass.
- "Sobre mí" agregado a la barra flotante de inicio (pedido de Jose).

## Próximos pasos inmediatos

- Revisar y fusionar `feat/hero-projects` (Jose).
- Probar en Safari/iPhone y Firefox reales (solo Jose).
- Resolver los pendientes de confirmar con Jose (ver `docs/TODO.md`).
- Después: resume, LinkedIn y perfil de GitHub desde el documento maestro.
