export const EMAIL = 'collinsmilimo47@gmail.com';
export const GITHUB = 'https://github.com/miliMORE';
export const LINKEDIN = 'https://www.linkedin.com/in/collins-milimo-90a136284/';

export const ROLES = [
  { when: 'Feb 2025 – present', title: 'Data Coordinator', org: 'Victoria Biomedical Research Institute (VIBRI)',
    points: ['Oversees data collection quality control, data entry, query resolution and statistical analysis, with performance reports','Generates statistical follow-up and monitoring reports','Designs and maintains data collection forms and study-specific source documents','Manages database backups and study filing systems','Documents data cleaning, standardisation and analysis procedures','Builds participant visit schedules and planners','Site visits to troubleshoot data issues'] },
  { when: 'Feb 2024 – Feb 2025', title: 'Regulatory Officer', org: 'Butere Clinical Research Centre (BCRC)',
    points: ['Regulatory documentation and submissions under GCP and applicable guidelines','Liaison with ethics committees, sponsors and investigators for study approvals','Timelines, communication and documentation for submissions and audit preparation'] },
  { when: 'Sep 2021 – Feb 2025', title: 'Data Manager', org: 'Butere Clinical Research Centre (BCRC)',
    points: ['Data clerk and data manager across Phase 1 to 4 clinical trials and validation studies','Data entry, validation and digitisation for clinical research','Document control, organisation and archiving'] },
];

// 13 studies from the CV, summarised. No protocol codes, sponsors or product names.
export const STUDY_GROUPS = [
  { type: 'Vaccine trials', studies: [
    { phase: 'Phase 2b', title: 'Tuberculosis vaccine efficacy, safety and immunogenicity', who: 'Adolescents and adults aged 14–45' },
    { phase: 'Phase 3', title: 'Tuberculosis vaccine prophylactic efficacy, safety and immunogenicity', who: 'Adolescents and adults' },
    { phase: 'Phase 2/3', title: 'Bivalent typhoid and paratyphoid A conjugate vaccine', who: 'Infants aged 9–12 months' },
    { phase: 'Phase 3', title: 'Respiratory syncytial virus (RSV) vaccine', who: 'Infants and toddlers' },
    { phase: 'Phase 3', title: 'Measles, mumps and rubella (MMR) vaccine non-inferiority', who: 'Children aged 9–11 months' },
    { phase: 'Phase 3', title: 'Adjuvanted recombinant protein COVID-19 vaccines', who: 'Adults 18+' },
    { phase: 'Phase not stated', title: 'Infant combination vaccine on the national immunisation schedule', who: 'Infants' },
  ] },
  { type: 'Sickle cell disease therapeutics', studies: [
    { phase: 'Phase 1', title: 'Single and multiple ascending dose safety and pharmacokinetics', who: 'Healthy volunteers and people with sickle cell disease' },
    { phase: 'Phase 2/3', title: 'Efficacy and safety of an investigational therapy', who: 'People with sickle cell disease' },
    { phase: 'Phase 3', title: 'Reducing vaso-occlusive crises', who: 'Adolescents and adults' },
    { phase: 'Phase 4', title: 'Treatment of leg ulcers', who: 'People with sickle cell disease' },
  ] },
  { type: 'Infectious disease: treatment', studies: [
    { phase: 'Phase not stated', title: 'Clearance of high-risk human papillomavirus (HPV)', who: 'Randomised, placebo-controlled' },
  ] },
  { type: 'Diagnostics validation', studies: [
    { phase: 'Non-interventional', title: 'Clinical validation of a scanner for detecting HIV, tuberculosis and malaria', who: 'Validation study' },
  ] },
];

export type Project = {
  slug: string;
  name: string;
  tag: string;
  tags: string[];
  blurb: string;
  stack: string[];
  outcome?: string;
  /** In-app case study. */
  href?: string;
  /** Public marketing page. Shown as a small "Visit site" link. */
  site?: { href: string; label: string };
  shot?: { name: string; url: string; alt: string };
};

export const PROJECTS: Project[] = [
  { slug: 'verdict', name: 'VERDICT', tag: 'Internet Congress', tags: ['client'], blurb: 'Built at Internet Congress: a platform for research ethics and scientific review committees covering submissions, reviews, meetings, decisions and verifiable approval letters.', shot: { name: 'verdict-home', url: 'verdictethics.com', alt: 'The VERDICT marketing site home page' }, stack: ['Next.js','TypeScript','Prisma','PostgreSQL'], site: { href: 'https://verdictethics.com', label: 'verdictethics.com' } },
  { slug: 'shelfcast', name: 'ShelfCast', tag: 'SaaS', tags: ['saas'], blurb: 'Turns ebooks you already own into private, downloadable audiobooks with text-to-speech.', shot: { name: 'shelfcast-home', url: 'ShelfCast (local demo)', alt: 'The ShelfCast landing page' }, stack: ['Next.js','TypeScript','Prisma','PostgreSQL','Docker'], href: '/projects/shelfcast' },
  { slug: 'salary-survey', name: 'Public-service salary survey platform', tag: 'Client work', tags: ['client'], blurb: 'Built for a client: county public-service salary and remuneration surveys with questionnaires, catalogues, document workflows, reports and workbook exports.', stack: ['Python','Django','openpyxl'] },
  { slug: 'fee-ledger', name: 'School fee & M-Pesa ledger', tag: 'Client work', tags: ['client'], blurb: 'Built for a client: student fee structures, payments, a ledger, bank and M-Pesa import batches, expenses and budgets, with role-based staff access.', stack: ['Python','Django'] },
];
