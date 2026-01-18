import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://themikemoniker.github.io',
  base: '/contract-scraper',
  output: 'static',
  build: {
    assets: 'assets',
  },
});
