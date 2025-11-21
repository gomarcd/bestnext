import Link from 'next/link';

import { getGuidesBySection } from '@/lib/guides';

export const metadata = {
  title: 'Accessibility — Renesas Design System'
};

export default function AccessibilityPage() {
  const guides = getGuidesBySection('Accessibility');

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold text-slate-900">Accessibility</h1>
        <p className="text-slate-600">Standards, checklists, and testing workflows to achieve WCAG 2.2 AA compliance.</p>
      </header>
      <div className="grid gap-4 md:grid-cols-2">
        {guides.map((guide) => (
          <Link
            key={guide.slug}
            href={guide.url ?? `/accessibility/${guide.slug}`}
            className="rounded-xl border border-ds-border bg-white p-6 shadow-sm transition hover:border-ds-primary"
          >
            <h2 className="text-xl font-semibold text-slate-900">{guide.title}</h2>
            <p className="mt-2 text-sm text-slate-600">{guide.description ?? 'Accessibility guidance.'}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
