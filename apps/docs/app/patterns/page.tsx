import Link from 'next/link';

import { getGuidesBySection } from '@/lib/guides';

export const metadata = {
  title: 'Patterns — Renesas Design System'
};

export default function PatternsPage() {
  const guides = getGuidesBySection('Patterns');

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold text-slate-900">Patterns</h1>
        <p className="text-slate-600">Reusable flows that stitch components together for form handling, dialogs, and feedback.</p>
      </header>
      <div className="grid gap-4 md:grid-cols-2">
        {guides.map((guide) => (
          <Link
            key={guide.slug}
            href={guide.url ?? `/patterns/${guide.slug}`}
            className="rounded-xl border border-ds-border bg-white p-6 shadow-sm transition hover:border-ds-primary"
          >
            <h2 className="text-xl font-semibold text-slate-900">{guide.title}</h2>
            <p className="mt-2 text-sm text-slate-600">{guide.description ?? 'Implementation pattern.'}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
