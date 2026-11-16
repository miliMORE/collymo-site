import type { APIRoute } from 'astro';

export const prerender = false;

const WINDOW_MS = 60 * 60 * 1000;
const MAX_PER_HOUR = 5;
const hits = new Map<string, number[]>();

const PROJECT_TYPES = [
  'Web app or platform',
  'Data system or dashboard',
  'Clinical data management support',
  'Something else',
];
const TIMELINES = ['ASAP', '1-3 months', '3+ months', 'Not sure'];
const SUBJECTS = { message: 'Message', work: 'Work enquiry', cv: 'CV request' } as const;
type Kind = keyof typeof SUBJECTS;

const UNAVAILABLE = 'form temporarily unavailable, please email instead';

function env(name: string): string {
  const value = process.env[name];
  return typeof value === 'string' ? value.trim() : '';
}

function clientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for') || '';
  const first = forwarded.split(',')[0]?.trim();
  return first || 'unknown';
}

function limited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX_PER_HOUR) {
    hits.set(ip, recent);
    return true;
  }
  recent.push(now);
  hits.set(ip, recent);
  return false;
}

function wantsJson(request: Request): boolean {
  if ((request.headers.get('accept') || '').includes('application/json')) return true;
  const type = request.headers.get('content-type') || '';
  const form = type.includes('application/x-www-form-urlencoded') || type.includes('multipart/form-data');
  return !form;
}

function safePage(raw: string): string {
  if (!raw.startsWith('/') || raw.startsWith('//') || raw.includes('//')) return '/';
  if (raw.length > 200 || !/^\/[A-Za-z0-9/_-]*$/.test(raw)) return '/';
  return raw;
}

function backTo(page: string, kind: string): string {
  const hash = kind === 'cv' ? '#contact-cv' : kind === 'work' ? '#contact-work' : '#contact';
  return `${safePage(page)}?error=1${hash}`;
}

function reply(request: Request, status: number, error: string | null, back = '/?error=1#contact'): Response {
  if (wantsJson(request)) {
    const body = error ? { ok: false, error } : { ok: true };
    return new Response(JSON.stringify(body), {
      status: error ? status : 200,
      headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
    });
  }
  return new Response(null, {
    status: 303,
    headers: { Location: error ? back : '/thanks', 'cache-control': 'no-store' },
  });
}

function textField(form: FormData, key: string): string | null {
  const value = form.get(key);
  if (value == null) return '';
  if (typeof value !== 'string') return null;
  return value.replace(/\u0000/g, '').trim();
}

function capped(value: string, max: number): boolean {
  return value.length <= max && !/[\r\n]/.test(value);
}

function nairobiNow(): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Africa/Nairobi',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    timeZoneName: 'short',
  }).format(new Date());
}

type Payload = {
  kind: Kind;
  name: string;
  email: string;
  message: string;
  organisation: string;
  projectType: string;
  timeline: string;
  budget: string;
  role: string;
  page: string;
};

function validate(form: FormData): { error: string } | { data: Payload } {
  const kind = textField(form, 'kind');
  const name = textField(form, 'name');
  const email = textField(form, 'email');
  const message = textField(form, 'message');
  const organisation = textField(form, 'organisation');
  const projectType = textField(form, 'project_type');
  const timeline = textField(form, 'timeline');
  const budget = textField(form, 'budget');
  const role = textField(form, 'role');
  const page = textField(form, 'page');
  const fields = [kind, name, email, message, organisation, projectType, timeline, budget, role, page];
  if (fields.some((value) => value === null)) return { error: 'Please check the form and try again.' };
  if (kind !== 'message' && kind !== 'work' && kind !== 'cv') return { error: 'Please check the form and try again.' };
  if (!name || name.length < 2 || name.length > 100 || /[\r\n]/.test(name)) return { error: 'Enter your name (2–100 characters).' };
  if (!email || email.length > 254 || /[\r\n\s]/.test(email) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: 'Enter a valid email address.' };
  }
  if (!message || message.length < 10 || message.length > 5000) return { error: 'Message must be between 10 and 5000 characters.' };
  if (!capped(organisation || '', 200) || !capped(role || '', 200) || !capped(budget || '', 200)) {
    return { error: 'Please check the form and try again.' };
  }
  if (!capped(projectType || '', 80) || !capped(timeline || '', 40)) return { error: 'Please check the form and try again.' };

  if (kind === 'work') {
    if (organisation && organisation.length < 2) return { error: 'Organisation must be 2–200 characters.' };
    if (!PROJECT_TYPES.includes(projectType || '')) return { error: 'Choose a project type.' };
    if (!TIMELINES.includes(timeline || '')) return { error: 'Choose a timeline.' };
  }
  if (kind === 'cv') {
    if (!organisation || organisation.length < 2) return { error: 'Enter your organisation (2–200 characters).' };
    if (!role || role.length < 2) return { error: 'Enter the role or opportunity (2–200 characters).' };
  }

  return {
    data: {
      kind,
      name,
      email,
      message,
      organisation: organisation || '',
      projectType: projectType || '',
      timeline: timeline || '',
      budget: budget || '',
      role: role || '',
      page: safePage(page || '/'),
    },
  };
}

function emailText(data: Payload): string {
  const lines = [`Kind: ${SUBJECTS[data.kind]}`, `Name: ${data.name}`, `Email: ${data.email}`];
  if (data.kind === 'work') {
    lines.push(
      `Organisation: ${data.organisation || '—'}`,
      `Project type: ${data.projectType}`,
      `Timeline: ${data.timeline}`,
      `Budget: ${data.budget || '—'}`,
    );
  }
  if (data.kind === 'cv') {
    lines.push(`Organisation: ${data.organisation}`, `Role or opportunity: ${data.role}`);
  }
  lines.push('', 'Message:', data.message, '', `Page: ${data.page}`, `Time: ${nairobiNow()}`);
  return lines.join('\n');
}

export const POST: APIRoute = async ({ request }) => {
  const declared = Number(request.headers.get('content-length') || 0);
  if (declared > 40_000) return reply(request, 400, 'Please check the form and try again.');

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return reply(request, 400, 'Please check the form and try again.');
  }

  const website = textField(form, 'website');
  if (website === null) return reply(request, 400, 'Please check the form and try again.');
  if (website !== '') return reply(request, 200, null);

  const parsed = validate(form);
  const kindGuess = textField(form, 'kind') || 'message';
  const pageGuess = textField(form, 'page') || '/';
  const back = backTo(pageGuess || '/', kindGuess || 'message');
  if ('error' in parsed) return reply(request, 400, parsed.error, back);

  const key = env('RESEND_API_KEY');
  const from = env('CONTACT_FROM');
  const to = env('CONTACT_TO');
  if (!key || !from || !to) return reply(request, 503, UNAVAILABLE, backTo(parsed.data.page, parsed.data.kind));

  if (limited(clientIp(request))) {
    return reply(request, 429, 'Too many messages from this network. Please try again later.', backTo(parsed.data.page, parsed.data.kind));
  }

  try {
    const sent = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from,
        to,
        reply_to: parsed.data.email,
        subject: `[collymo.com] ${SUBJECTS[parsed.data.kind]} from ${parsed.data.name}`,
        text: emailText(parsed.data),
      }),
    });
    if (!sent.ok) {
      console.error('contact form: resend status', sent.status);
      return reply(request, 502, 'Could not send your message. Please email instead.', backTo(parsed.data.page, parsed.data.kind));
    }
  } catch {
    console.error('contact form: resend request failed');
    return reply(request, 502, 'Could not send your message. Please email instead.', backTo(parsed.data.page, parsed.data.kind));
  }

  return reply(request, 200, null);
};
