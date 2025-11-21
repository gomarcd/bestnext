import Image from 'next/image';
import Link from 'next/link';
import { allComponentDocs } from 'contentlayer/generated';

export default function HomePage() {
  const components = allComponentDocs.slice(0, 6);

  return (
    <div className="space-y-16">
      <section className="rounded-2xl border border-ds-border bg-ds-surface p-10 shadow-sm">
        <div className="max-w-3xl space-y-6">
          <span className="inline-flex items-center rounded-full border border-ds-border bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wide text-ds-primary">
            Renesas Design System
          </span>
          <h1 className="text-4xl font-semibold text-slate-900">Design faster. Ship consistently. Delight users.</h1>
          <p className="text-lg text-slate-600">
            A searchable, production-ready design system for Drupal and the web. Explore documented patterns, copy code
            snippets, and pull tokens straight into your build pipeline.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/components/button"
              className="rounded-md bg-ds-primary px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-ds-primary-dark"
            >
              View components
            </Link>
            <Link
              href="/developers/getting-started"
              className="rounded-md border border-ds-border px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-ds-primary hover:text-ds-primary"
            >
              Implementation guide
            </Link>
          </div>
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-900">Components</h2>
          <Link href="/components" className="text-sm font-medium text-ds-primary">
            View all components
          </Link>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
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
                  <h3 className="text-lg font-semibold text-slate-900">{component.title}</h3>
                  <p className="mt-1 text-sm text-slate-600">{component.summary}</p>
                </div>
                <span className="inline-flex items-center rounded-full border border-slate-300 px-2 py-0.5 text-[11px] uppercase tracking-wide text-slate-500">
                  {component.status}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
