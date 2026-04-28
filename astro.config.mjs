import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  output: 'static',
  site: 'https://example.com',
  adapter: cloudflare(),
  base: '/',
  integrations: [mdx(), sitemap()],
});