import type { Locale } from '../themes/contract';
import { RESUME_LABELS, RESUME_VARIANTS, resumePath } from '../../scripts/lib/resume-meta.mjs';

type ResumeVariant = 'ai' | 'fullstack';
type Labels = { resume: string; variants: Record<ResumeVariant, string> };

/** Enlaces a los resumes de un idioma, para que cualquier tema los muestre. */
export function resumeLinks(locale: Locale): { href: string; label: string }[] {
  const labels = (RESUME_LABELS as Record<Locale, Labels>)[locale];
  return (RESUME_VARIANTS as ResumeVariant[]).map((v) => ({
    href: resumePath(locale, v) as string,
    label: `${labels.resume} · ${labels.variants[v]}`,
  }));
}

export function resumeLabel(locale: Locale): string {
  return (RESUME_LABELS as Record<Locale, Labels>)[locale].resume;
}
