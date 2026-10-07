import { describe, it, expect } from 'vitest';
import { join, resolve } from 'node:path';
import { privateOutDir } from '../scripts/resume-private.mjs';

describe('privateOutDir', () => {
  const repo = resolve('repo-x');
  it('usa "Resume - archivos" dentro del portfolio', () => {
    expect(privateOutDir(resolve('vault/Portfolio'), repo)).toBe(join(resolve('vault/Portfolio'), 'Resume - archivos'));
  });
  it('se niega a escribir dentro del repo público', () => {
    expect(() => privateOutDir(join(repo, 'content'), repo)).toThrow(/dentro del repo/);
  });
});
