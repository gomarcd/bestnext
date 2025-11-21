import Link from 'next/link';
import type { Metadata } from 'next';

import type { ReactNode } from 'react';

import { getCmsPageTitle } from '@/lib/cms/title';
import { getPageByPath } from '@/lib/cms/pages';
import type { PageBlock, PageColumn, PageSection } from '@/lib/cms/types';
import { getGuidesBySection } from '@/lib/guides';

const VERSION = 'v1.0.0-preview';
const GITHUB_URL = 'https://github.com/virtual-design-system';

const AUTHORS = [
  {
    name: 'Jordan Lee',
    role: 'Lead UX Designer',
    email: 'jordan.lee@virtualds.com',
    avatar: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=200&q=80'
  },
  {
    name: 'Priya Menon',
    role: 'Design Ops Partner',
    email: 'priya.menon@virtualds.com',
    avatar: 'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=200&q=80'
  },
  {
    name: 'Diego Martins',
    role: 'Lead UX Engineer',
    email: 'diego.martins@virtualds.com',
    avatar: 'https://images.unsplash.com/photo-1556157382-97eda2d62296?auto=format&fit=crop&w=200&q=80'
  }
];

const CONTRIBUTION_STEPS = [
  'Open a proposal in GitHub using the RFC template with problem framing and desired outcomes.',
  'Prototype alongside the design system core team to validate accessibility, interaction, and visual fit.',
  'Partner with engineering peers to align code standards, tokens, and test coverage.',
  'Ship with documentation updates, usage guidance, and a changelog entry so teams can adopt confidently.'
];

const DEFAULT_PAGE_TITLE = 'About the experience layer for every Virtual product team';

export async function generateMetadata(): Promise<Metadata> {
  const title = await getCmsPageTitle('/about', DEFAULT_PAGE_TITLE);
  return { title };
}

export default async function AboutPage() {
  const changelogEntries = getGuidesBySection('Changelog');
  const pageTitle = await getCmsPageTitle('/about', DEFAULT_PAGE_TITLE);
  const cmsPage = await getPageByPath('/about');
  const sections = cmsPage?.sections ?? [];

  const heroSection = findSection(sections, 'hero');
  const highlightsSection = findSection(sections, 'highlights');
  const changelogSection = findSection(sections, 'changelog section');
  const coreTeamSection = findSection(sections, 'core team');
  const contributionSection = findSection(sections, 'contribution model');

  return (
    <div className="space-y-16">
      {renderSectionColumns(
        heroSection,
        [12],
        [
          <section key="hero" className="rounded-3xl border border-ds-border bg-ds-surface px-8 py-12 shadow-sm md:px-12">
            <div className="max-w-3xl space-y-6">
              <span className="inline-flex items-center rounded-full bg-ds-primary/10 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-ds-primary">
                Renesas Design System
              </span>
              <h1 className="text-4xl font-semibold text-slate-900 md:text-5xl">{pageTitle}</h1>
              <p className="text-lg text-slate-600">
                The Renesas Design System blends UX research, reusable code, and platform-ready governance to help our teams ship cohesive
                experiences faster. This hub keeps product, design, and engineering aligned on the why, how, and what of the system.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/components"
                  className="rounded-full bg-ds-primary px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-ds-primary-dark"
                >
                  Explore components
                </Link>
                <Link
                  href="/developers/getting-started"
                  className="rounded-full border border-ds-border px-5 py-2 text-sm font-semibold text-slate-700 transition hover:border-ds-primary hover:text-ds-primary"
                >
                  Implementation guide
                </Link>
              </div>
            </div>
          </section>
        ],
        'hero'
      )}

      {renderSectionColumns(
        highlightsSection,
        [4, 4, 4],
        [
          <div key="highlight-1" className="rounded-2xl border border-ds-border bg-ds-surface p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Current version</p>
            <p className="mt-3 text-2xl font-semibold text-slate-900">{VERSION}</p>
            <p className="mt-2 text-sm text-slate-600">
              Includes refreshed foundations, accessible components, and our Drupal starter kit.
            </p>
          </div>,
          <div
            key="highlight-2"
            className="rounded-2xl border border-ds-border bg-gradient-to-br from-ds-primary to-ds-primary-dark p-6 text-white shadow-sm"
          >
            <p className="text-xs font-semibold uppercase tracking-wide">Source of truth</p>
            <p className="mt-3 text-2xl font-semibold">GitHub repository</p>
            <p className="mt-2 text-sm text-white/80">
              Track issues, propose enhancements, and partner with the core team on releases.
            </p>
            <Link
              href={GITHUB_URL}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex items-center rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
            >
              Open repo
            </Link>
          </div>,
          <div key="highlight-3" className="rounded-2xl border border-ds-border bg-ds-surface p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Changelog coverage</p>
            <p className="mt-3 text-2xl font-semibold text-slate-900">
              {changelogEntries.length > 0 ? `${changelogEntries.length} releases` : 'No entries yet'}
            </p>
            <p className="mt-2 text-sm text-slate-600">
              Every release is logged with adoption guidance and platform parity details.
            </p>
          </div>
        ],
        'highlights'
      )}

      {renderSectionColumns(
        changelogSection,
        [12],
        [
          <section key="changelog" className="space-y-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-slate-900">Changelog</h2>
                <p className="text-sm text-slate-600">Stay current with version updates and adoption guidance.</p>
              </div>
              <Link
                href="/changelog"
                className="inline-flex items-center rounded-full border border-ds-border px-4 py-1.5 text-sm font-medium text-slate-700 shadow-sm transition hover:border-ds-primary hover:text-ds-primary"
              >
                View all entries
              </Link>
            </div>
            <div className="space-y-4">
              {changelogEntries.slice(0, 3).map((entry) => (
                <article key={entry.slug} className="rounded-2xl border border-ds-border bg-white p-5 shadow-sm transition hover:border-ds-primary/60">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">{entry.title}</h3>
                      {entry.description ? <p className="text-sm text-slate-600">{entry.description}</p> : null}
                    </div>
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">{entry.version ?? 'Preview'}</span>
                  </div>
                  <Link href={entry.url ?? `/changelog/${entry.slug}`} className="mt-3 inline-flex items-center text-sm font-semibold text-ds-primary">
                    Read release notes
                  </Link>
                </article>
              ))}
              {changelogEntries.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-ds-border bg-white p-6 text-sm text-slate-500">
                  Releases will appear once the first update ships.
                </div>
              ) : null}
            </div>
          </section>
        ],
        'changelog'
      )}

      {renderSectionColumns(
        coreTeamSection,
        [4, 4, 4],
        AUTHORS.map((author) => (
          <div key={author.email} className="rounded-2xl border border-ds-border bg-white p-6 text-center shadow-sm">
            <img
              src={author.avatar}
              alt={author.name}
              className="mx-auto h-20 w-20 rounded-full border border-white object-cover shadow-sm"
            />
            <div className="mt-4 space-y-1">
              <h3 className="text-lg font-semibold text-slate-900">{author.name}</h3>
              <p className="text-sm text-slate-600">{author.role}</p>
              <a href={`mailto:${author.email}`} className="text-xs font-medium text-ds-primary">
                {author.email}
              </a>
            </div>
          </div>
        )),
        'core-team'
      )}

      {renderSectionColumns(
        contributionSection,
        [12],
        [
          <section key="contribution" className="rounded-2xl border border-ds-border bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-semibold text-slate-900">Contribution model</h2>
            <p className="mt-2 text-sm text-slate-600">
              Propose, prototype, and ship updates with the design system core team using this workflow.
            </p>
            <ol className="mt-4 space-y-3 text-sm text-slate-700">
              {CONTRIBUTION_STEPS.map((step, index) => (
                <li key={step} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-6 w-6 flex-none items-center justify-center rounded-full bg-ds-primary/10 text-xs font-semibold text-ds-primary">
                    {index + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </section>
        ],
        'contribution'
      )}
    </div>
  );
}

function findSection(sections: PageSection[], title: string): PageSection | undefined {
  return sections.find((section) => section.title?.trim().toLowerCase() === title.toLowerCase());
}

function renderSectionColumns(
  section: PageSection | undefined,
  defaultSpans: number[],
  fallbackContent: ReactNode[],
  keyPrefix: string
): ReactNode {
  const columns = section?.columns?.length
    ? section.columns
    : defaultSpans.map((span, index) => createFallbackColumn(span, index, keyPrefix));

  return (
    <div key={section?.id ?? `fallback-${keyPrefix}`} className="grid grid-cols-12 gap-6">
      {columns.map((column, index) => {
        const fallback = fallbackContent[index] ?? null;
        return (
          <div
            key={column.id ?? `column-${keyPrefix}-${index}`}
            className="space-y-6"
            style={{ gridColumn: `span ${resolveSpan(column.span, defaultSpans[index])} / span ${resolveSpan(column.span, defaultSpans[index])}` }}
          >
            {renderColumnContent(column, fallback)}
          </div>
        );
      })}
    </div>
  );
}

function renderColumnContent(column: PageColumn, fallback: ReactNode): ReactNode {
  const blocks = column.blocks ?? [];
  if (blocks.length === 0) {
    return fallback ?? null;
  }

  const rendered = blocks
    .map((block, index) => renderBlock(block, index))
    .filter((node): node is ReactNode => Boolean(node));

  if (rendered.length === 0) {
    return fallback ?? null;
  }

  return rendered;
}

function renderBlock(block: PageBlock, index: number): ReactNode | null {
  if (block.kind === 'component') {
    return (
      <div
        key={block.id ?? `component-block-${index}`}
        className="rounded-xl border border-dashed border-ds-border bg-white p-6 text-center text-sm text-slate-500"
      >
        <p className="font-semibold text-slate-700">Component: {block.componentId ?? 'Unknown'}</p>
        <p className="text-xs text-slate-500">Visual rendering will be available in a future release.</p>
      </div>
    );
  }

  const html = block.html?.trim();
  if (!html) {
    return null;
  }

  return (
    <div
      key={block.id ?? `rich-text-${index}`}
      className="prose prose-slate max-w-none"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

function createFallbackColumn(span: number, index: number, keyPrefix: string): PageColumn {
  return {
    id: `fallback-column-${keyPrefix}-${index}`,
    span,
    blocks: []
  };
}

function resolveSpan(span: number | undefined, fallback: number | undefined): number {
  const value = Number.isFinite(span) && span ? span : fallback ?? 12;
  return Math.min(12, Math.max(1, value));
}
