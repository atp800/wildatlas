import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://wildatlas.org',
  base: '/',
  integrations:[mdx(), sitemap()],
  vite: {
    server: {
      // Poll saved files on Windows: synced folders can miss native watch events.
      // Development only; production builds and hosting are unaffected.
      watch: process.platform === 'win32' ? { usePolling: true, interval: 500 } : undefined,
    },
  },
});
