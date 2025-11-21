import Link from 'next/link';

import { getGuidesBySection } from '@/lib/guides';

export const metadata = {
  title: 'Changelog — Renesas Design System'
};

export default function ChangelogPage() {
  const entries = getGuidesBySection('Changelog');

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold text-slate-900">Changelog</h1>
        <p className="text-slate-600">Releases, deprecations, and breaking changes across tokens, components, and Drupal bridge.</p>
      </header>
      <div className="space-y-4">
        {entries.map((entry) => (
          <article key={entry.slug} className="rounded-xl border border-ds-border bg-white p-6 shadow-sm">
            <Link href={entry.url ?? `/changelog/${entry.slug}`} className="text-xl font-semibold text-slate-900">
              {entry.title}
            </Link>
            {entry.description ? <p className="mt-2 text-sm text-slate-600">{entry.description}</p> : null}
          </article>
        ))}
      </div>
    </div>
  );
}
