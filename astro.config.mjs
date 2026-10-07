import { defineConfig } from 'astro/config';
import { fileURLToPath } from 'node:url';
import portfolio from './portfolio.config.mjs';

const theme = process.env.PORTFOLIO_THEME || portfolio.theme;

export default defineConfig({
  site: portfolio.site,
  build: { format: 'directory' },
  vite: {
    resolve: {
      alias: {
        '@theme': fileURLToPath(new URL(`./src/themes/${theme}/index.ts`, import.meta.url)),
      },
    },
  },
});
