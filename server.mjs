// Production server: gzip/brotli-negotiated compression, long cache for hashed
// assets, a day for images/icons, and the www -> apex redirect for every path
// (including static files, which bypass Astro middleware).
import express from 'express';
import compression from 'compression';
import { handler as ssr } from './dist/server/entry.mjs';

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', true);

app.use((req, res, next) => {
  if (req.path === '/projects/verdict' || req.path === '/projects/verdict/') {
    return res.redirect(301, 'https://verdictethics.com');
  }
  const host = String(req.headers['x-forwarded-host'] || req.headers.host || '').split(',')[0].trim().toLowerCase().replace(/:\d+$/, '');
  if (host === 'www.collymo.com') return res.redirect(301, `https://collymo.com${req.originalUrl}`);
  next();
});
app.use(compression());
app.use(express.static('dist/client', {
  index: false,
  setHeaders(res, path) {
    if (path.includes('/_astro/')) res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    else if (/\.(avif|webp|png|jpe?g|ico|svg)$/.test(path)) res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');
    else res.setHeader('Cache-Control', 'public, max-age=3600');
  },
}));
app.use(ssr);

const port = Number(process.env.PORT) || 8080;
app.listen(port, '0.0.0.0', () => console.log(`collymo-site listening on ${port}`));
