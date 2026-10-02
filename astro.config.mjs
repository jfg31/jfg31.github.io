import { defineConfig } from 'astro/config';
import { fileURLToPath } from 'node:url';
import portfolio from './portfolio.config.mjs';

export default defineConfig({
  site: 'https://jfg31.github.io',
  build: { format: 'directory' },
  vite: {
    resolve: {
      alias: {
        '@theme': fileURLToPath(new URL(`./src/themes/${portfolio.theme}/index.ts`, import.meta.url)),
      },
    },
  },
});
