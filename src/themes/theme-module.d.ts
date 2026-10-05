// Tipo del módulo virtual '@theme' (resuelto por alias de Vite al tema activo).
// Todo tema debe exportar estos cuatro componentes con las props del contrato.
declare module '@theme' {
  import type { AstroComponentFactory } from 'astro/runtime/server/index.js';
  export const HomePage: AstroComponentFactory;
  export const ProjectsPage: AstroComponentFactory;
  export const CasePage: AstroComponentFactory;
  export const AboutPage: AstroComponentFactory;
}
