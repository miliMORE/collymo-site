import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  site: 'https://collymo.com',
  // 'server' so middleware (www -> apex 301) runs for every page; in static mode the
  // Node adapter serves prerendered files before middleware.
  output: 'server',
  // Astro's checkOrigin 403s same-origin POSTs behind Railway's proxy (seen on verdict-site).
  // Contact forms post here, so origin checks stay off. A honeypot and rate limit cover spam.
  security: { checkOrigin: false },
  adapter: node({ mode: 'middleware' }), // served by server.mjs (compression + cache headers)
  integrations: [tailwind()], // sitemap.xml is src/pages/sitemap.xml.ts
});
