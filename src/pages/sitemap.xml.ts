import type { APIRoute } from 'astro';
export const prerender = true;
const pages = [['/', '1.0'], ['/clinical-research', '0.8'], ['/projects/verdict', '0.7'], ['/projects/shelfcast', '0.6']];
export const GET: APIRoute = () => {
  const lastmod = new Date().toISOString().slice(0, 10);
  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pages.map(([p, pr]) => `  <url><loc>https://collymo.com${p}</loc><lastmod>${lastmod}</lastmod><priority>${pr}</priority></url>`).join('\n')}\n</urlset>\n`;
  return new Response(body, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
