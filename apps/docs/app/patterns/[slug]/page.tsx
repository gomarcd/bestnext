import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

import { getGuideBySlug, getGuidesBySection } from '@/lib/guides';
import { MDX } from '@/components/mdx/mdx';
import { getCmsPageTitle } from '@/lib/cms/title';

interface PageProps {
  params: {
    slug: string;
  };
}

export function generateStaticParams() {
  return getGuidesBySection('Patterns').map((doc) => ({ slug: doc.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const doc = getGuideBySlug(params.slug);
  if (!doc) return {};
  const title = await getCmsPageTitle(doc.url ?? `/patterns/${params.slug}`, doc.title);
  return {
    title: `${title} — Patterns`,
    description: doc.description
  };
}

export default async function PatternGuidePage({ params }: PageProps) {
  const doc = getGuideBySlug(params.slug);
  if (!doc) {
    notFound();
  }
  const title = await getCmsPageTitle(doc.url ?? `/patterns/${params.slug}`, doc.title);

  return (
    <article className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Patterns</p>
        <h1 className="text-3xl font-semibold text-slate-900">{title}</h1>
        {doc.description ? <p className="text-slate-600">{doc.description}</p> : null}
      </header>
      <MDX code={doc.body.code} />
    </article>
  );
}
