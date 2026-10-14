// GSAP is loaded lazily, only when the visitor allows motion.
type G = typeof import('gsap').gsap;
let gsap: G | null = null;
let ST: typeof import('gsap/ScrollTrigger').ScrollTrigger | null = null;
let ctx: gsap.Context | null = null;
const cleanups: Array<() => void> = [];

const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = () => window.matchMedia('(hover: hover) and (pointer: fine)').matches;

async function load() {
  if (gsap) return;
  const [{ gsap: g }, { ScrollTrigger }] = await Promise.all([import('gsap'), import('gsap/ScrollTrigger')]);
  g.registerPlugin(ScrollTrigger);
  gsap = g; ST = ScrollTrigger;
  (window as any).__gsap = g; // used by the What I do tabs for panel transitions
}

function animate() {
  const g = gsap!;
  ctx = g.context(() => {
    // Hero: word-by-word headline, then the rest of the hero
    const words = document.querySelectorAll('[data-split] .w > span');
    const tl = g.timeline({ defaults: { ease: 'power3.out' } });
    if (words.length) tl.fromTo(words, { yPercent: 110, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.9, stagger: 0.06 });
    const heroBits = document.querySelectorAll('[data-hero] .reveal');
    if (heroBits.length) tl.fromTo(heroBits, { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, stagger: 0.1 }, words.length ? '-=0.5' : 0);

    // Cutout photo: entrance + gentle parallax while scrolling past the hero
    const photo = document.querySelector('[data-parallax]');
    if (photo) {
      tl.fromTo(photo, { y: 40, opacity: 0, scale: 0.96 }, { y: 0, opacity: 1, scale: 1, duration: 1.1 }, 0.15);
      g.to(photo, { yPercent: -10, ease: 'none', scrollTrigger: { trigger: photo.closest('section'), start: 'top top', end: 'bottom top', scrub: true } });
      const blob = document.querySelector('[data-blob]');
      if (blob) g.to(blob, { yPercent: 12, ease: 'none', scrollTrigger: { trigger: blob.closest('section'), start: 'top top', end: 'bottom top', scrub: true } });
    }

    // Everything else: staggered reveals per section
    const rest = g.utils.toArray<HTMLElement>('.reveal').filter(el => !el.closest('[data-hero]'));
    ST!.batch(rest, {
      start: 'top 88%', once: true,
      onEnter: (els) => g.fromTo(els, { y: 32, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out', stagger: 0.08, overwrite: true }),
    });


    // Counters
    g.utils.toArray<HTMLElement>('[data-count]').forEach(el => {
      const end = Number(el.dataset.count); const from = Number(el.dataset.from ?? 0);
      const o = { v: from };
      g.fromTo(o, { v: from }, { v: end, duration: 1.6, ease: 'power2.out', scrollTrigger: { trigger: el, start: 'top 90%', once: true }, onUpdate: () => { el.textContent = String(Math.round(o.v)); } });
    });

    // Timeline line draws as you scroll; dots pop in
    g.utils.toArray<HTMLElement>('[data-timeline]').forEach(tlEl => {
      const line = tlEl.querySelector('[data-line]');
      if (line) g.fromTo(line, { scaleY: 0 }, { scaleY: 1, ease: 'none', scrollTrigger: { trigger: tlEl, start: 'top 75%', end: 'bottom 60%', scrub: 0.6 } });
      tlEl.querySelectorAll('[data-dot]').forEach(dot => g.fromTo(dot, { scale: 0 }, { scale: 1, duration: 0.5, ease: 'back.out(3)', scrollTrigger: { trigger: dot, start: 'top 80%', once: true } }));
    });
  });

  // Hover: tilt on project cards, magnetic pull on buttons (fine pointers only)
  if (finePointer()) {
    document.querySelectorAll<HTMLElement>('[data-tilt]').forEach(card => {
      const qx = g.quickTo(card, 'rotationY', { duration: 0.5, ease: 'power3' });
      const qy = g.quickTo(card, 'rotationX', { duration: 0.5, ease: 'power3' });
      g.set(card, { transformPerspective: 900 });
      const move = (e: PointerEvent) => { const r = card.getBoundingClientRect(); const px = (e.clientX - r.left) / r.width - 0.5; const py = (e.clientY - r.top) / r.height - 0.5; qx(px * 8); qy(-py * 8); card.style.setProperty('--mx', `${(px + 0.5) * 100}%`); card.style.setProperty('--my', `${(py + 0.5) * 100}%`); };
      const leave = () => { qx(0); qy(0); };
      card.addEventListener('pointermove', move); card.addEventListener('pointerleave', leave);
      cleanups.push(() => { card.removeEventListener('pointermove', move); card.removeEventListener('pointerleave', leave); });
    });
    document.querySelectorAll<HTMLElement>('[data-magnetic]').forEach(btn => {
      const qx = g.quickTo(btn, 'x', { duration: 0.4, ease: 'power3' });
      const qy = g.quickTo(btn, 'y', { duration: 0.4, ease: 'power3' });
      const move = (e: PointerEvent) => { const r = btn.getBoundingClientRect(); qx((e.clientX - r.left - r.width / 2) * 0.25); qy((e.clientY - r.top - r.height / 2) * 0.35); };
      const leave = () => { qx(0); qy(0); };
      btn.addEventListener('pointermove', move); btn.addEventListener('pointerleave', leave);
      cleanups.push(() => { btn.removeEventListener('pointermove', move); btn.removeEventListener('pointerleave', leave); });
    });
  }
  document.documentElement.dataset.motionReady = '1';
}

function teardown() {
  ctx?.revert(); ctx = null;
  cleanups.splice(0).forEach(f => f());
  ST?.getAll().forEach(t => t.kill());
}

async function start() {
  const html = document.documentElement;
  if (reduced()) { html.classList.remove('motion'); return; }
  html.classList.add('motion');
  try { await load(); animate(); ST!.refresh(); }
  catch { html.classList.remove('motion'); } // never leave content hidden
}

document.addEventListener('astro:before-swap', teardown);
document.addEventListener('astro:page-load', start);
window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', () => { teardown(); start(); });
