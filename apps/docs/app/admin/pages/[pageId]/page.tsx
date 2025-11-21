import Link from 'next/link';
import { notFound } from 'next/navigation';

import {
  deletePageAction,
  updatePageAction
} from '@/app/admin/pages/actions';
import { requireAdmin } from '@/lib/auth/guards';
import { getPageById } from '@/lib/cms/pages';
import type { PageStatus } from '@/lib/cms/types';

interface PageDetailProps {
  params: {
    pageId: string;
  };
}

export const metadata = {
  title: 'Edit Page — Renesas Design System Admin'
};

export default async function PageDetail({ params }: PageDetailProps) {
  await requireAdmin(`/admin/pages/${params.pageId}`);

  const page = await getPageById(params.pageId);

  if (!page) {
    notFound();
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-8 px-4 py-12 sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-wide text-slate-400">Editing page</p>
          <h1 className="text-3xl font-semibold text-slate-900">{page.title}</h1>
          <p className="text-sm text-slate-600">
            Manage metadata, status, and future content editing from this workspace.
          </p>
        </div>
        <Link
          href="/admin/pages"
          className="inline-flex items-center rounded-md border border-ds-border bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-ds-primary hover:text-ds-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ds-primary"
        >
          ← Back to All Pages
        </Link>
      </div>

      <section className="space-y-6 rounded-2xl border border-ds-border bg-white p-6 shadow-sm">
        <header className="space-y-2">
          <h2 className="text-lg font-semibold text-slate-900">Metadata</h2>
          <p className="text-sm text-slate-600">
            Update the page title, slug, or status. Changes apply immediately after saving.
          </p>
        </header>
        <form action={updatePageAction} className="grid gap-4 sm:grid-cols-2">
          <input type="hidden" name="pageId" value={page.id} />
          <div>
            <label className="block text-sm font-medium text-slate-700">Title</label>
            <input
              name="title"
              defaultValue={page.title}
              className="mt-1 block w-full rounded-md border border-ds-border px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-ds-primary focus:outline-none focus:ring-2 focus:ring-ds-primary/20"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Slug</label>
            <input
              name="slug"
              defaultValue={page.slug}
              className="mt-1 block w-full rounded-md border border-ds-border px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-ds-primary focus:outline-none focus:ring-2 focus:ring-ds-primary/20"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Custom path</label>
            <input
              name="path"
              defaultValue={page.path}
              className="mt-1 block w-full rounded-md border border-ds-border px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-ds-primary focus:outline-none focus:ring-2 focus:ring-ds-primary/20"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Status</label>
            <select
              name="status"
              defaultValue={page.status}
              className="mt-1 block w-full rounded-md border border-ds-border px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-ds-primary focus:outline-none focus:ring-2 focus:ring-ds-primary/20"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {statusLabel(option)}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2 flex justify-end gap-3">
            <button
              type="submit"
              className="inline-flex items-center rounded-md bg-ds-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-ds-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ds-primary"
            >
              Save changes
            </button>
          </div>
        </form>
      </section>

      <section className="space-y-4 rounded-2xl border border-red-200 bg-red-50 p-6">
        <h2 className="text-base font-semibold text-red-700">Danger zone</h2>
        <p className="text-sm text-red-600">
          Removing a page deletes all nested children and their revisions. This action cannot be
          undone.
        </p>
        <form action={deletePageAction}>
          <input type="hidden" name="pageId" value={page.id} />
          <button
            type="submit"
            className="inline-flex items-center rounded-md border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-700 shadow-sm transition hover:border-red-500 hover:text-red-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500"
          >
            Delete page and descendants
          </button>
        </form>
      </section>
    </div>
  );
}

const STATUS_OPTIONS: PageStatus[] = ['draft', 'review', 'published', 'archived'];

function statusLabel(status: PageStatus): string {
  switch (status) {
    case 'draft':
      return 'Draft';
    case 'review':
      return 'In review';
    case 'published':
      return 'Published';
    case 'archived':
      return 'Archived';
    default:
      return status;
  }
}
