import { defineMiddleware } from 'astro:middleware';

const CANONICAL = 'collymo.com';

export const onRequest = defineMiddleware((context, next) => {
  const raw = context.request.headers.get('x-forwarded-host') || context.request.headers.get('host') || '';
  const host = raw.split(',')[0].trim().toLowerCase().replace(/:\d+$/, '');
  if (host === `www.${CANONICAL}`) {
    const { pathname, search } = context.url;
    return new Response(null, { status: 301, headers: { Location: `https://${CANONICAL}${pathname}${search}` } });
  }
  return next();
});
