import Image from 'next/image';
import Link from 'next/link';
import { allComponentDocs } from 'contentlayer/generated';

import { sortByTitle } from '@/lib/sort';

export const metadata = {
  title: 'Components — Renesas Design System'
};

export default function ComponentsIndexPage() {
  const components = sortByTitle(allComponentDocs, (doc) => doc.title);

  return (
    <div className="space-y-10">
      <header className="space-y-3">
        <h1 className="text-3xl font-semibold text-slate-900">Components</h1>
        <p className="text-slate-600">
          Production-ready Web Components with implementation guidance, tokens, and accessibility checklists.
        </p>
      </header>
      <div className="grid gap-4 md:grid-cols-2">
        {components.map((component) => (
          <Link
            key={component.slug}
            href={component.url ?? `/components/${component.slug}`}
            className="rounded-xl border border-ds-border bg-white p-6 shadow-sm transition hover:border-ds-primary"
          >
            <div className="overflow-hidden rounded-xl bg-slate-100">
              <Image
                src={component.preview ?? '/previews/default.svg'}
                alt={`${component.title} preview`}
                width={400}
                height={220}
                className="h-auto w-full object-cover"
              />
            </div>
            <div className="mt-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">{component.title}</h2>
                <p className="mt-1 text-sm text-slate-600">{component.summary}</p>
              </div>
              <span className="inline-flex items-center rounded-full border border-slate-300 px-2 py-0.5 text-[11px] uppercase tracking-wide text-slate-500">
                {component.status}
              </span>
            </div>
            <div className="mt-4 flex flex-wrap gap-2 text-[11px] uppercase tracking-wide text-slate-400">
              {component.tags?.map((tag) => (
                <span key={tag} className="rounded-full border border-slate-200 px-2 py-0.5">
                  {tag}
                </span>
              ))}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
