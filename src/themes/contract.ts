// Contrato entre la data y la presentación. Todo tema en src/themes/<nombre>/
// exporta HomePage, ProjectsPage, CasePage y AboutPage que reciben estas props.
export type Locale = 'en' | 'es';
export const LOCALES: Locale[] = ['en', 'es'];

export type Category = 'automatizacion' | 'infraestructura' | 'producto' | 'clientes' | 'herramientas-ia' | 'hardware';
export const CATEGORY_ORDER: Category[] = ['automatizacion', 'infraestructura', 'producto', 'clientes', 'herramientas-ia', 'hardware'];

export const STATUSES = ['activo', 'live', 'prototipo', 'completado'] as const;
export type Status = (typeof STATUSES)[number];

export interface CaseText {
  title: string;
  /** Título corto opcional (≤ 24 caracteres, texto plano) para pastillas y pestañas; si falta, los temas usan `title`. */
  shortTitle?: string;
  summary: string;
  problem: string;
  solution: string;
  outcome: string;
}

export interface DiagramStep { label: string; detail: string }

export interface Case {
  slug: string;
  featured: 1 | 2 | 3;
  category: Category;
  stack: string[];
  period: string;
  status: Status;
  links: { demo?: string; repo?: string };
  updated: string;
  text: Record<Locale, CaseText>;
  diagram?: Record<Locale, DiagramStep[]>;
}

export interface ProfileText { headline: string; about: string; education: string; experience: string; certifications: string; hardware: string }

export interface Profile {
  name: string;
  email: string;
  github: string;
  linkedin: string;
  updated: string;
  text: Record<Locale, ProfileText>;
}

export type ResumeVariant = 'ai' | 'fullstack';
export const RESUME_VARIANT_LIST: ResumeVariant[] = ['ai', 'fullstack'];

export interface ResumeText {
  title: string;
  summary: string;
  skills: { group: string; items: string }[];
  experience: { role: string; company: string; dates: string; bullets: string[] };
  projects: { name: string; slug: string; text: string }[];
  education: { title: string; institution: string; year: string }[];
  certifications: { title: string; issuer: string; year: string }[];
}

/** Generado por `pnpm export` desde Resume.md; nunca contiene la sección privada. */
export interface Resume {
  updated: string;
  variants: Record<ResumeVariant, Record<Locale, ResumeText>>;
}

export interface UiStrings {
  siteTitle: string;
  nav: { home: string; projects: string; about: string };
  switchLanguage: string;
  featured: string;
  allProjects: string;
  contact: string;
  stack: string;
  period: string;
  updated: string;
  problem: string;
  solution: string;
  outcome: string;
  demo: string;
  repo: string;
  categories: Record<Category, string>;
  statuses: Record<Status, string>;
  profileSections: { about: string; education: string; experience: string; certifications: string; hardware: string };
  lensHint: string;
  theme: { label: string; light: string; dark: string; system: string; switchTo: string };
  language: string;
  sections: { work: string; index: string; contact: string };
  /** Nombre accesible de la barra flotante (tema glass): con anclas de la página o con enlaces entre páginas. */
  tabBar: { sections: string; pages: string };
  skipToContent: string;
  /** Etiqueta corta de un caso destacado en el índice (tema glass). */
  featuredTag: string;
  /** Enlace de un panel de trabajo destacado a su página de caso (tema glass). */
  readCase: string;
  /** Título del diagrama de un caso (tema glass). */
  caseDiagramTitle: string;
  /** Etiqueta del grupo de pastillas del hero que llevan a cada trabajo destacado (tema glass). */
  selectedProjects: string;
}

export interface ThemeProps {
  locale: Locale;
  ui: UiStrings;
  profile: Profile;
  cases: Case[];
}

export type CasePageProps = ThemeProps & { item: Case };
