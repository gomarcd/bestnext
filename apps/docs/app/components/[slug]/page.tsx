import type { Metadata } from 'next';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { notFound } from 'next/navigation';

import { allComponentDocs } from 'contentlayer/generated';

import { ComponentHeader } from '@/components/component/component-header';
import { PropsTable } from '@/components/component/props-table';
import { EventsTable } from '@/components/component/events-table';
import { SlotsTable } from '@/components/component/slots-table';
import { TokenMap } from '@/components/component/token-map';
import { CodeSamples } from '@/components/component/code-samples';
import { AccessibilityPanel } from '@/components/component/a11y-panel';
import { DependenciesList } from '@/components/component/dependencies-list';
import { StorybookEmbed } from '@/components/component/storybook-embed';
import { MDX } from '@/components/mdx/mdx';
import { getCmsPageTitle } from '@/lib/cms/title';

const ComponentPreview = dynamic(() => import('@/components/component/component-preview'), { ssr: false });

interface ComponentPageProps {
  params: {
    slug: string;
  };
}

export function generateStaticParams() {
  return allComponentDocs.map((doc) => ({ slug: doc.slug }));
}

export async function generateMetadata({ params }: ComponentPageProps): Promise<Metadata> {
  const doc = allComponentDocs.find((component) => component.slug === params.slug);
  if (!doc) return {};
  const title = await getCmsPageTitle(doc.url ?? `/components/${params.slug}`, doc.title);
  return {
    title: `${title} — Components`,
    description: doc.summary
  };
}

export default async function ComponentPage({ params }: ComponentPageProps) {
  const doc = allComponentDocs.find((component) => component.slug === params.slug);

  if (!doc) {
    notFound();
  }

  const pageTitle = await getCmsPageTitle(doc.url ?? `/components/${params.slug}`, doc.title);

  const related = doc.related
    ?.map((id) => allComponentDocs.find((component) => component.id === id))
    .filter((component): component is typeof doc => Boolean(component));

  const storyId = `components-${doc.id}--primary`;

  return (
    <div className="space-y-12">
      <ComponentHeader doc={doc} title={pageTitle} />

      <section className="space-y-6" id="overview">
        <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-slate-900">Overview &amp; Guidance</h2>
          <span className="text-sm text-slate-500">Generated from MDX content</span>
        </div>
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-slate-900">Live preview</h3>
          <div className="rounded-2xl border border-ds-border bg-white p-6 shadow-sm">
            <ComponentPreview componentId={doc.id} />
          </div>
        </div>
        <MDX code={doc.body.code} />
      </section>

      <section className="space-y-12" id="developer">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Developer documentation</h2>
          <p className="text-sm text-slate-600">Props, events, slots, and tokens sourced directly from component source.</p>
        </div>
        <div className="grid gap-8 lg:grid-cols-2">
          <PropsTable props={doc.props} />
          <EventsTable events={doc.events} />
          <SlotsTable slots={doc.slots} />
          <TokenMap tokens={doc.tokens} />
        </div>
        <DependenciesList dependencies={doc.dependencies} />
      </section>

      <div id="accessibility">
        <AccessibilityPanel a11y={doc.a11y} />
      </div>

      <section className="space-y-4" id="code">
        <h2 className="text-xl font-semibold text-slate-900">Code samples</h2>
        <CodeSamples code={doc.code} />
      </section>

      <section className="space-y-4" id="examples">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-900">Examples &amp; Playground</h2>
          {process.env.NEXT_PUBLIC_STORYBOOK_URL ? (
            <Link
              href={process.env.NEXT_PUBLIC_STORYBOOK_URL}
              target="_blank"
              rel="noreferrer"
              className="text-sm font-medium text-ds-primary"
            >
              Open Storybook
            </Link>
          ) : null}
        </div>
        <StorybookEmbed storyId={storyId} />
      </section>

      {related && related.length > 0 ? (
        <section className="space-y-4" id="related">
          <h2 className="text-xl font-semibold text-slate-900">Related patterns</h2>
          <div className="flex flex-wrap gap-3">
            {related.map((component) => (
              <Link
                key={component.slug}
                href={component.url ?? `/components/${component.slug}`}
                className="rounded-full border border-ds-border px-4 py-1 text-sm text-slate-600 transition hover:border-ds-primary hover:text-ds-primary"
              >
                {component.title}
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
