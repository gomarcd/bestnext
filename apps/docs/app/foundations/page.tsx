import Link from 'next/link';

import { getGuidesBySection } from '@/lib/guides';

export const metadata = {
  title: 'Foundations — Renesas Design System'
};

export default function FoundationsPage() {
  const guides = getGuidesBySection('Foundations');

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold text-slate-900">Foundations</h1>
        <p className="text-slate-600">Color, typography, spacing, motion, and theming tokens that underpin every experience.</p>
      </header>
      <div className="grid gap-4 md:grid-cols-2">
        {guides.map((guide) => (
          <Link
            key={guide.slug}
            href={guide.url ?? `/foundations/${guide.slug}`}
            className="rounded-xl border border-ds-border bg-white p-6 shadow-sm transition hover:border-ds-primary"
          >
            <h2 className="text-xl font-semibold text-slate-900">{guide.title}</h2>
            <p className="mt-2 text-sm text-slate-600">{guide.description ?? 'Design foundations guidance.'}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
