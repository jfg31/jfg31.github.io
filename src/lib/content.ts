import type { Case, Profile } from '../themes/contract';
import { sortCases } from './cases';

const caseModules = import.meta.glob<Case>('../../content/cases/*.json', { eager: true, import: 'default' });
const profileModules = import.meta.glob<Profile>('../../content/profile.json', { eager: true, import: 'default' });

export function getCases(): Case[] {
  return sortCases(Object.values(caseModules));
}

export function getProfile(): Profile {
  const profile = Object.values(profileModules)[0];
  if (!profile) throw new Error('content/profile.json no existe — correr `pnpm export`');
  return profile;
}
