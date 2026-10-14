import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://collymo.com',
  // 'server' so middleware (www -> apex 301) runs for every page; in static mode the
  // Node adapter serves prerendered files before middleware.
  output: 'server',
  // Astro's checkOrigin 403s same-origin POSTs behind Railway's proxy (seen on verdict-site).
  // This site has no forms, so it is simply off.
  security: { checkOrigin: false },
  adapter: node({ mode: 'middleware' }), // served by server.mjs (compression + cache headers)
  integrations: [tailwind(), sitemap()],
});
