import Link from 'next/link';
import type { ComponentDoc } from 'contentlayer/generated';

interface ComponentHeaderProps {
  doc: ComponentDoc;
  title?: string;
}

const STATUS_LABEL: Record<ComponentDoc['status'], string> = {
  alpha: 'Alpha',
  beta: 'Beta',
  stable: 'Stable'
};

export function ComponentHeader({ doc, title }: ComponentHeaderProps) {
  return (
    <section className="rounded-2xl border border-ds-border bg-white p-8 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              {STATUS_LABEL[doc.status]}
            </span>
            <span className="inline-flex items-center rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Since {doc.since}
            </span>
          </div>
          <h1 className="text-4xl font-semibold text-slate-900">{title ?? doc.title}</h1>
          <p className="max-w-2xl text-lg text-slate-600">{doc.summary}</p>
          <div className="flex flex-wrap gap-2 text-xs uppercase tracking-wide text-slate-400">
            {doc.tags?.map((tag) => (
              <span key={tag} className="rounded-full border border-slate-200 px-2 py-0.5">
                {tag}
              </span>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-3 text-sm text-slate-600">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400">Package</p>
            <code className="mt-1 inline-flex rounded bg-slate-100 px-2 py-1 font-mono text-xs text-slate-700">
              {doc.componentName}
            </code>
          </div>
          {doc.figma ? (
            <Link
              href={doc.figma}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-md border border-ds-border px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-ds-primary hover:text-ds-primary"
            >
              View in Figma
            </Link>
          ) : null}
        </div>
      </div>
    </section>
  );
}
