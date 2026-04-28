import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  output: 'static',
  site: 'https://wildatlas.org',
  adapter: cloudflare(),
  base: '/',
  integrations: [mdx(), sitemap()],
});