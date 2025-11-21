import Link from 'next/link';
import { redirect } from 'next/navigation';

import { getCurrentUser } from '@/lib/auth/session';

export const metadata = {
  title: 'Admin Dashboard — Renesas Design System'
};

export default async function AdminDashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login?next=/admin');
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 px-4 py-12 sm:px-6">
      <div className="space-y-2">
        <p className="text-sm uppercase tracking-wide text-slate-400">Welcome back</p>
        <h1 className="text-3xl font-semibold text-slate-900">Admin dashboard</h1>
        <p className="max-w-3xl text-base text-slate-600">
          This area will house content management tools, workflows, and collaboration features for
          the Renesas Design System. Use the sections below to jump into the key management
          workspaces.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <AdminTile
          title="Pages & hierarchy"
          description="Review, reorder, and organize every page in the design system. Manage custom URLs and navigation placement."
        href="/admin/pages"
        />
        <AdminTile
          title="Templates & builder"
          description="Create reusable page templates, configure drag-and-drop blocks, and tailor layouts to your teams."
          href="/admin/templates"
        />
      </div>
    </div>
  );
}

interface AdminTileProps {
  title: string;
  description: string;
  href: string;
}

function AdminTile({ title, description, href }: AdminTileProps) {
  return (
    <Link
      href={href}
      className="flex h-full flex-col justify-between rounded-2xl border border-ds-border bg-white p-6 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-ds-primary hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ds-primary"
    >
      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        <p className="text-sm text-slate-600">{description}</p>
      </div>
    </Link>
  );
}
