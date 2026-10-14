# collymo-site

Portfolio for Collins Milimo (collymo.com). Astro 5 + Tailwind + View Transitions, Node adapter (output: server) so `src/middleware.ts` can 301 www.collymo.com to the apex.

```
npm install && npm run dev
npm run build && PORT=8080 npm start
```

Content lives in `src/data.ts`. No analytics. The CV is never published; visitors request it by email.
