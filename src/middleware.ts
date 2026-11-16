import { defineMiddleware } from 'astro:middleware';

const CANONICAL = 'collymo.com';

export const onRequest = defineMiddleware((context, next) => {
  const { pathname, search } = context.url;
  // External config redirects run before middleware and rewrite the URL, so this is the 301.
  if (pathname === '/projects/verdict' || pathname === '/projects/verdict/') {
    return new Response(null, { status: 301, headers: { Location: 'https://verdictethics.com' } });
  }
  const raw = context.request.headers.get('x-forwarded-host') || context.request.headers.get('host') || '';
  const host = raw.split(',')[0].trim().toLowerCase().replace(/:\d+$/, '');
  if (host === `www.${CANONICAL}`) {
    return new Response(null, { status: 301, headers: { Location: `https://${CANONICAL}${pathname}${search}` } });
  }
  return next();
});
