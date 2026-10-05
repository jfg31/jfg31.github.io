import type { Locale, UiStrings } from '../themes/contract';

export const ui: Record<Locale, UiStrings> = {
  en: {
    siteTitle: 'Jose Flores — Automation & AI Engineer',
    nav: { home: 'Home', projects: 'Projects', about: 'About' },
    switchLanguage: 'Español',
    featured: 'Featured work',
    allProjects: 'All projects',
    contact: 'Contact',
    stack: 'Stack',
    period: 'Period',
    updated: 'Updated',
    problem: 'Problem',
    solution: 'Solution',
    outcome: 'Outcome',
    demo: 'Live demo',
    repo: 'Source code',
    categories: {
      automatizacion: 'Automation',
      infraestructura: 'Infrastructure',
      producto: 'Products',
      clientes: 'Local businesses',
      'herramientas-ia': 'AI tooling',
      hardware: 'Hardware',
    },
    statuses: { activo: 'Active', live: 'Live', prototipo: 'Prototype', completado: 'Completed' },
    profileSections: { about: 'About me', education: 'Education', experience: 'Experience', certifications: 'Certifications', hardware: 'Hardware' },
    sitePipelineTitle: 'How this site is made',
    sitePipeline: [
      { label: 'Vault', detail: 'My private notes are the source of truth and are never published.' },
      { label: 'Export', detail: 'Public sections become JSON content in English and Spanish.' },
      { label: 'Privacy lint', detail: 'A pre-push hook blocks sensitive data on every push.' },
      { label: 'Build', detail: 'A static Astro site, plus a check that every case is rendered.' },
      { label: 'Deploy', detail: 'GitHub Pages publishes it here, on every push to main.' },
    ],
    lensHint: 'Hover or tap the diagram to look through the glass.',
    theme: { label: 'Color theme', light: 'Light', dark: 'Dark', system: 'System', switchTo: 'switch to' },
    language: 'Language',
    sections: { work: 'Work', index: 'Index', contact: 'Contact' },
    skipToContent: 'Skip to content',
    featuredTag: 'Featured',
    readCase: 'Read the full case',
    caseDiagramTitle: 'How it works',
  },
  es: {
    siteTitle: 'Jose Flores — Ingeniero de Automatización e IA',
    nav: { home: 'Inicio', projects: 'Proyectos', about: 'Sobre mí' },
    switchLanguage: 'English',
    featured: 'Trabajo destacado',
    allProjects: 'Todos los proyectos',
    contact: 'Contacto',
    stack: 'Stack',
    period: 'Periodo',
    updated: 'Actualizado',
    problem: 'Problema',
    solution: 'Solución',
    outcome: 'Resultado',
    demo: 'Ver demo',
    repo: 'Código fuente',
    categories: {
      automatizacion: 'Automatización',
      infraestructura: 'Infraestructura',
      producto: 'Productos',
      clientes: 'Negocios locales',
      'herramientas-ia': 'Herramientas de IA',
      hardware: 'Hardware',
    },
    statuses: { activo: 'Activo', live: 'En producción', prototipo: 'Prototipo', completado: 'Completado' },
    profileSections: { about: 'Sobre mí', education: 'Educación', experience: 'Experiencia', certifications: 'Certificaciones', hardware: 'Hardware' },
    sitePipelineTitle: 'Cómo se hace este sitio',
    sitePipeline: [
      { label: 'Vault', detail: 'Mis notas privadas son la fuente de verdad y nunca se publican.' },
      { label: 'Export', detail: 'Las secciones públicas se convierten en contenido JSON en español e inglés.' },
      { label: 'Privacy lint', detail: 'Un hook antes de cada push bloquea cualquier dato sensible.' },
      { label: 'Build', detail: 'Un sitio estático con Astro, y una verificación de que cada caso se muestra.' },
      { label: 'Deploy', detail: 'GitHub Pages lo publica aquí con cada push a main.' },
    ],
    lensHint: 'Pasa el cursor o toca el diagrama para mirar a través del vidrio.',
    theme: { label: 'Tema de color', light: 'Claro', dark: 'Oscuro', system: 'Sistema', switchTo: 'cambiar a' },
    language: 'Idioma',
    sections: { work: 'Trabajo', index: 'Índice', contact: 'Contacto' },
    skipToContent: 'Saltar al contenido',
    featuredTag: 'Destacado',
    readCase: 'Leer el caso completo',
    caseDiagramTitle: 'Cómo funciona',
  },
};

export function otherLocale(locale: Locale): Locale {
  return locale === 'en' ? 'es' : 'en';
}

export function localePath(locale: Locale, subpath = ''): string {
  const clean = subpath.replace(/^\/+|\/+$/g, '');
  return clean ? `/${locale}/${clean}/` : `/${locale}/`;
}
