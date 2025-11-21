'use client';

import Link from 'next/link';

interface PageEditBannerProps {
  path: string;
  exitHref: string;
  settingsHref: string;
}

export function PageEditBanner({ path, exitHref, settingsHref }: PageEditBannerProps) {
  return (
    <div className="mb-6 rounded-xl border border-ds-primary/40 bg-ds-primary/5 p-4 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-ds-primary">Edit mode</p>
          <h2 className="text-sm font-medium text-slate-700">
            You are editing <code className="rounded bg-white px-1 py-0.5 text-xs text-slate-600">{path}</code>
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Content editing tools are in development. Head to the admin workspace to update metadata, status, or layout.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={settingsHref}
            className="inline-flex items-center rounded-full border border-ds-border bg-white px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-600 transition hover:border-ds-primary hover:text-ds-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ds-primary"
          >
            Open page settings
          </Link>
          <Link
            href={exitHref}
            className="inline-flex items-center rounded-full bg-ds-primary px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-white shadow-sm transition hover:bg-ds-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ds-primary"
          >
            Exit edit mode
          </Link>
        </div>
      </div>
    </div>
  );
}
