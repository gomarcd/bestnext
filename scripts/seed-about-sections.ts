#!/usr/bin/env tsx

import fs from 'node:fs/promises';
import path from 'node:path';

interface PageBlock {
  id: string;
  kind: 'rich-text' | 'component';
  html?: string;
  componentId?: string;
  props?: Record<string, unknown>;
}

interface PageColumn {
  id: string;
  span: number;
  blocks: PageBlock[];
}

interface PageSection {
  id: string;
  title?: string;
  columns: PageColumn[];
}

interface PageRecord {
  id: string;
  path: string;
  title: string;
  sections: PageSection[];
  [key: string]: unknown;
}

interface CmsData {
  pages: PageRecord[];
  [key: string]: unknown;
}

function generateId(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`;
}

const VERSION = 'v1.0.0-preview';
const GITHUB_URL = 'https://github.com/virtual-design-system';

const HERO_HTML = `<section class="rounded-3xl border border-ds-border bg-ds-surface px-8 py-12 shadow-sm md:px-12">
  <div class="max-w-3xl space-y-6">
    <span class="inline-flex items-center rounded-full bg-ds-primary/10 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-ds-primary">Renesas Design System</span>
    <h1 class="text-4xl font-semibold text-slate-900 md:text-5xl">About the experience layer for every Virtual product team</h1>
    <p class="text-lg text-slate-600">The Renesas Design System blends UX research, reusable code, and platform-ready governance to help our teams ship cohesive experiences faster. This hub keeps product, design, and engineering aligned on the why, how, and what of the system.</p>
    <div class="flex flex-wrap gap-3">
      <a class="rounded-full bg-ds-primary px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-ds-primary-dark" href="/components">Explore components</a>
      <a class="rounded-full border border-ds-border px-5 py-2 text-sm font-semibold text-slate-700 transition hover:border-ds-primary hover:text-ds-primary" href="/developers/getting-started">Implementation guide</a>
    </div>
  </div>
</section>`;

const HIGHLIGHTS_HTML = [
  `<div class="rounded-2xl border border-ds-border bg-ds-surface p-6 shadow-sm">
    <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">Current version</p>
    <p class="mt-3 text-2xl font-semibold text-slate-900">${VERSION}</p>
    <p class="mt-2 text-sm text-slate-600">Includes refreshed foundations, accessible components, and our Drupal starter kit.</p>
  </div>`,
  `<div class="rounded-2xl border border-ds-border bg-gradient-to-br from-ds-primary to-ds-primary-dark p-6 text-white shadow-sm">
    <p class="text-xs font-semibold uppercase tracking-wide">Source of truth</p>
    <p class="mt-3 text-2xl font-semibold">GitHub repository</p>
    <p class="mt-2 text-sm text-white/80">Track issues, propose enhancements, and partner with the core team on releases.</p>
    <a class="mt-4 inline-flex items-center rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20" href="${GITHUB_URL}" target="_blank" rel="noreferrer">Open repo</a>
  </div>`,
  `<div class="rounded-2xl border border-ds-border bg-ds-surface p-6 shadow-sm">
    <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">Changelog coverage</p>
    <p class="mt-3 text-2xl font-semibold text-slate-900">3 releases</p>
    <p class="mt-2 text-sm text-slate-600">Every release is logged with adoption guidance and platform parity details.</p>
  </div>`
];

const CHANGELOG_HTML = `<section class="space-y-6">
  <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
    <div>
      <h2 class="text-2xl font-semibold text-slate-900">Changelog</h2>
      <p class="text-sm text-slate-600">Stay current with version updates and adoption guidance.</p>
    </div>
    <a class="inline-flex items-center rounded-full border border-ds-border px-4 py-1.5 text-sm font-medium text-slate-700 shadow-sm transition hover:border-ds-primary hover:text-ds-primary" href="/changelog">View all entries</a>
  </div>
  <div class="space-y-4">
    <article class="rounded-2xl border border-ds-border bg-white p-5 shadow-sm transition hover:border-ds-primary/60">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 class="text-lg font-semibold text-slate-900">Foundations 1.0</h3>
          <p class="text-sm text-slate-600">Updated typography scale and color tokens for improved contrast.</p>
        </div>
        <span class="text-xs font-semibold uppercase tracking-wide text-slate-400">v1.0.0</span>
      </div>
      <a class="mt-3 inline-flex items-center text-sm font-semibold text-ds-primary" href="/changelog/foundations-1-0">Read release notes</a>
    </article>
    <article class="rounded-2xl border border-ds-border bg-white p-5 shadow-sm transition hover:border-ds-primary/60">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 class="text-lg font-semibold text-slate-900">Components preview</h3>
          <p class="text-sm text-slate-600">Introduced button, card, and alert components with code examples.</p>
        </div>
        <span class="text-xs font-semibold uppercase tracking-wide text-slate-400">Preview</span>
      </div>
      <a class="mt-3 inline-flex items-center text-sm font-semibold text-ds-primary" href="/changelog/components-preview">Read release notes</a>
    </article>
  </div>
</section>`;

const CORE_TEAM_HTML = [
  `<div class="rounded-2xl border border-ds-border bg-white p-6 text-center shadow-sm">
    <img src="https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&amp;fit=crop&amp;w=200&amp;q=80" alt="Jordan Lee" class="mx-auto h-20 w-20 rounded-full border border-white object-cover shadow-sm" />
    <div class="mt-4 space-y-1">
      <h3 class="text-lg font-semibold text-slate-900">Jordan Lee</h3>
      <p class="text-sm text-slate-600">Lead UX Designer</p>
      <a href="mailto:jordan.lee@virtualds.com" class="text-xs font-medium text-ds-primary">jordan.lee@virtualds.com</a>
    </div>
  </div>`,
  `<div class="rounded-2xl border border-ds-border bg-white p-6 text-center shadow-sm">
    <img src="https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&amp;fit=crop&amp;w=200&amp;q=80" alt="Priya Menon" class="mx-auto h-20 w-20 rounded-full border border-white object-cover shadow-sm" />
    <div class="mt-4 space-y-1">
      <h3 class="text-lg font-semibold text-slate-900">Priya Menon</h3>
      <p class="text-sm text-slate-600">Design Ops Partner</p>
      <a href="mailto:priya.menon@virtualds.com" class="text-xs font-medium text-ds-primary">priya.menon@virtualds.com</a>
    </div>
  </div>`,
  `<div class="rounded-2xl border border-ds-border bg-white p-6 text-center shadow-sm">
    <img src="https://images.unsplash.com/photo-1556157382-97eda2d62296?auto=format&amp;fit=crop&amp;w=200&amp;q=80" alt="Diego Martins" class="mx-auto h-20 w-20 rounded-full border border-white object-cover shadow-sm" />
    <div class="mt-4 space-y-1">
      <h3 class="text-lg font-semibold text-slate-900">Diego Martins</h3>
      <p class="text-sm text-slate-600">Lead UX Engineer</p>
      <a href="mailto:diego.martins@virtualds.com" class="text-xs font-medium text-ds-primary">diego.martins@virtualds.com</a>
    </div>
  </div>`
];

const CONTRIBUTION_HTML = `<section class="rounded-2xl border border-ds-border bg-white p-6 shadow-sm">
  <h2 class="text-2xl font-semibold text-slate-900">Contribution model</h2>
  <p class="mt-2 text-sm text-slate-600">Propose, prototype, and ship updates with the design system core team using this workflow.</p>
  <ol class="mt-4 space-y-3 text-sm text-slate-700">
    <li class="flex items-start gap-3">
      <span class="mt-0.5 flex h-6 w-6 flex-none items-center justify-center rounded-full bg-ds-primary/10 text-xs font-semibold text-ds-primary">1</span>
      <span>Open a proposal in GitHub using the RFC template with problem framing and desired outcomes.</span>
    </li>
    <li class="flex items-start gap-3">
      <span class="mt-0.5 flex h-6 w-6 flex-none items-center justify-center rounded-full bg-ds-primary/10 text-xs font-semibold text-ds-primary">2</span>
      <span>Prototype alongside the design system core team to validate accessibility, interaction, and visual fit.</span>
    </li>
    <li class="flex items-start gap-3">
      <span class="mt-0.5 flex h-6 w-6 flex-none items-center justify-center rounded-full bg-ds-primary/10 text-xs font-semibold text-ds-primary">3</span>
      <span>Partner with engineering peers to align code standards, tokens, and test coverage.</span>
    </li>
    <li class="flex items-start gap-3">
      <span class="mt-0.5 flex h-6 w-6 flex-none items-center justify-center rounded-full bg-ds-primary/10 text-xs font-semibold text-ds-primary">4</span>
      <span>Ship with documentation updates, usage guidance, and a changelog entry so teams can adopt confidently.</span>
    </li>
  </ol>
</section>`;

function richTextBlock(html: string): PageBlock {
  return {
    id: generateId('block'),
    kind: 'rich-text',
    html
  };
}

async function main() {
  const dataPath = path.join(process.cwd(), 'data', 'cms.json');
  const file = await fs.readFile(dataPath, 'utf8');
  const data = JSON.parse(file) as CmsData;

  let aboutPage = data.pages.find((page) => page.path === '/about');
  if (!aboutPage) {
    aboutPage = {
      id: generateId('page'),
      path: '/about',
      title: 'About the experience layer for every Virtual product team',
      sections: [],
      status: 'published',
      parentId: null,
      order: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      body: ''
    } as PageRecord;
    data.pages.push(aboutPage);
  }

  aboutPage.sections = [
    {
      id: generateId('section'),
      title: 'Hero',
      columns: [
        {
          id: generateId('column'),
          span: 12,
          blocks: [richTextBlock(HERO_HTML)]
        }
      ]
    },
    {
      id: generateId('section'),
      title: 'Highlights',
      columns: HIGHLIGHTS_HTML.map((html) => ({
        id: generateId('column'),
        span: 4,
        blocks: [richTextBlock(html)]
      }))
    },
    {
      id: generateId('section'),
      title: 'Changelog section',
      columns: [
        {
          id: generateId('column'),
          span: 12,
          blocks: [richTextBlock(CHANGELOG_HTML)]
        }
      ]
    },
    {
      id: generateId('section'),
      title: 'Core team',
      columns: CORE_TEAM_HTML.map((html) => ({
        id: generateId('column'),
        span: 4,
        blocks: [richTextBlock(html)]
      }))
    },
    {
      id: generateId('section'),
      title: 'Contribution model',
      columns: [
        {
          id: generateId('column'),
          span: 12,
          blocks: [richTextBlock(CONTRIBUTION_HTML)]
        }
      ]
    }
  ];

  aboutPage.updatedAt = new Date().toISOString();
  aboutPage.body = '';

  await fs.writeFile(dataPath, JSON.stringify(data, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
