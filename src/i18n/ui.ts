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
    lensHint: 'Hover, tap or use the arrow keys to look through the glass.',
    theme: { label: 'Color theme', light: 'Light', dark: 'Dark', system: 'System', switchTo: 'switch to' },
    language: 'Language',
    sections: { work: 'Work', index: 'Index', contact: 'Contact' },
    tabBar: { sections: 'On this page', pages: 'Site' },
    skipToContent: 'Skip to content',
    featuredTag: 'Featured',
    readCase: 'Read the full case',
    caseDiagramTitle: 'How it works',
    selectedProjects: 'Selected projects',
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
    lensHint: 'Pasa el cursor, toca o usa las flechas para mirar a través del vidrio.',
    theme: { label: 'Tema de color', light: 'Claro', dark: 'Oscuro', system: 'Sistema', switchTo: 'cambiar a' },
    language: 'Idioma',
    sections: { work: 'Trabajo', index: 'Índice', contact: 'Contacto' },
    tabBar: { sections: 'En esta página', pages: 'Sitio' },
    skipToContent: 'Saltar al contenido',
    featuredTag: 'Destacado',
    readCase: 'Leer el caso completo',
    caseDiagramTitle: 'Cómo funciona',
    selectedProjects: 'Proyectos destacados',
  },
};

export function otherLocale(locale: Locale): Locale {
  return locale === 'en' ? 'es' : 'en';
}

export function localePath(locale: Locale, subpath = ''): string {
  const clean = subpath.replace(/^\/+|\/+$/g, '');
  return clean ? `/${locale}/${clean}/` : `/${locale}/`;
}
