// Production server: gzip/brotli-negotiated compression, long cache for hashed
// assets, a day for images/icons, and the www -> apex redirect for every path
// (including static files, which bypass Astro middleware).
import { existsSync, readFileSync } from 'node:fs';
import express from 'express';
import compression from 'compression';
import { handler as ssr } from './dist/server/entry.mjs';

// Local dev reads .env. Existing process env (Railway, or a test shell) wins.
function loadLocalEnv() {
  if (!existsSync('.env')) return;
  let text = '';
  try { text = readFileSync('.env', 'utf8'); } catch { return; }
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq < 1) continue;
    const key = trimmed.slice(0, eq).trim();
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) continue;
    if (process.env[key]) continue;
    let value = trimmed.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    process.env[key] = value;
  }
}
loadLocalEnv();

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
// Leave the body unparsed so Astro can read /api/contact (form POST and fetch).
app.use(ssr);

const port = Number(process.env.PORT) || 8080;
app.listen(port, '0.0.0.0', () => console.log(`collymo-site listening on ${port}`));
