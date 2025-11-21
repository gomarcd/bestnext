import Link from 'next/link';
import { notFound } from 'next/navigation';

import {
  createPageAction,
  deletePageAction,
  movePageAction,
  updatePageAction
} from '@/app/admin/pages/actions';
import { PageSearch } from '@/components/admin/page-search';
import { requireAdmin } from '@/lib/auth/guards';
import { getPageTree } from '@/lib/cms/pages';
import type { PageTreeNode } from '@/lib/cms/types';

export const metadata = {
  title: 'Pages & Hierarchy — Renesas Design System Admin'
};

export default async function AdminPagesManagementPage() {
  await requireAdmin('/admin/pages');

  const tree = await getPageTree();

  const flatPages = flattenTree(tree);

  if (!tree) {
    notFound();
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 px-4 py-12 sm:px-6">
      <header className="space-y-2">
        <p className="text-sm uppercase tracking-wide text-slate-400">Content operations</p>
        <h1 className="text-3xl font-semibold text-slate-900">Pages & hierarchy</h1>
        <p className="max-w-3xl text-base text-slate-600">
          Manage the structure of the design system documentation. Create new entries, adjust their
          order, and change visibility states before publishing.
        </p>
      </header>

      <details className="rounded-2xl border border-ds-border bg-white shadow-sm transition open:shadow-md">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-6 py-4 text-sm font-semibold text-slate-900 hover:bg-slate-50">
          <span>Create New Page</span>
          <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Expand to configure details
          </span>
        </summary>
        <div className="border-t border-ds-border px-6 py-6">
          <p className="text-sm text-slate-600">
            New pages start as drafts. Assign them to a section now or move them later from the All
            Pages table.
          </p>
          <form action={createPageAction} className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-1">
              <label htmlFor="title" className="block text-sm font-medium text-slate-700">
                Title
              </label>
              <input
                id="title"
                name="title"
                type="text"
                required
                className="mt-1 block w-full rounded-md border border-ds-border px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-ds-primary focus:outline-none focus:ring-2 focus:ring-ds-primary/20"
                placeholder="Foundations overview"
              />
            </div>
            <div>
              <label htmlFor="parentId" className="block text-sm font-medium text-slate-700">
                Parent section
              </label>
              <select
                id="parentId"
                name="parentId"
                className="mt-1 block w-full rounded-md border border-ds-border px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-ds-primary focus:outline-none focus:ring-2 focus:ring-ds-primary/20"
                defaultValue=""
              >
                <option value="">Top-level (root)</option>
                {flatPages.map((page) => (
                  <option key={page.id} value={page.id}>
                    {`${'— '.repeat(page.depth)}${page.title}`}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="slug" className="block text-sm font-medium text-slate-700">
                Custom slug (optional)
              </label>
              <input
                id="slug"
                name="slug"
                type="text"
                className="mt-1 block w-full rounded-md border border-ds-border px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-ds-primary focus:outline-none focus:ring-2 focus:ring-ds-primary/20"
                placeholder="foundations-overview"
              />
            </div>
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-slate-700">
                Status
              </label>
              <select
                id="status"
                name="status"
                className="mt-1 block w-full rounded-md border border-ds-border px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-ds-primary focus:outline-none focus:ring-2 focus:ring-ds-primary/20"
                defaultValue="draft"
              >
                <option value="draft">Draft</option>
                <option value="review">In review</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            <div className="sm:col-span-2 flex justify-end">
              <button
                type="submit"
                className="inline-flex items-center rounded-md bg-ds-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-ds-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ds-primary"
              >
                Create New Page
              </button>
            </div>
          </form>
        </div>
      </details>

      <section className="space-y-6 rounded-2xl border border-ds-border bg-white p-6 shadow-sm">
        <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">All Pages</h2>
            <p className="text-sm text-slate-600">
              Drag and drop features are coming soon. Use the controls below to adjust ordering,
              rename entries, or change visibility.
            </p>
          </div>
          <div className="w-full sm:w-80">
            <PageSearch pages={flatPages} />
          </div>
        </header>

        <div className="space-y-4">
          {tree.length === 0 ? (
            <p className="rounded-md border border-dashed border-ds-border px-4 py-6 text-center text-sm text-slate-500">
              No pages yet. Start by creating your first entry above.
            </p>
          ) : (
            tree.map((node) => <PageNode key={node.id} node={node} depth={0} />)
          )}
        </div>
      </section>
    </div>
  );
}

function PageNode({ node, depth }: { node: PageTreeNode; depth: number }) {
  const indent = depth * 16;
  return (
    <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4" style={{ marginLeft: indent }}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              {node.status}
            </span>
            <h3 className="text-base font-semibold text-slate-900">{node.title}</h3>
          </div>
          <p className="text-xs text-slate-500">
            <code className="rounded bg-slate-200/80 px-1.5 py-0.5 text-slate-600">{node.path}</code>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`${node.path}?edit=true`}
            prefetch={false}
            className="rounded-md bg-ds-primary px-3 py-1 text-xs font-semibold text-white shadow-sm transition hover:bg-ds-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ds-primary"
          >
            Edit page
          </Link>
          <Link
            href={`/admin/pages/${node.id}`}
            className="rounded-md border border-ds-border bg-white px-3 py-1 text-xs font-semibold text-slate-600 shadow-sm transition hover:border-ds-primary hover:text-ds-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ds-primary"
          >
            Page settings
          </Link>
          <form action={movePageAction}>
            <input type="hidden" name="pageId" value={node.id} />
            <input type="hidden" name="direction" value="up" />
            <button
              type="submit"
              className="rounded-md border border-ds-border bg-white px-2 py-1 text-xs font-medium text-slate-600 transition hover:border-ds-primary hover:text-ds-primary"
            >
              Move up
            </button>
          </form>
          <form action={movePageAction}>
            <input type="hidden" name="pageId" value={node.id} />
            <input type="hidden" name="direction" value="down" />
            <button
              type="submit"
              className="rounded-md border border-ds-border bg-white px-2 py-1 text-xs font-medium text-slate-600 transition hover:border-ds-primary hover:text-ds-primary"
            >
              Move down
            </button>
          </form>
          <form action={deletePageAction}>
            <input type="hidden" name="pageId" value={node.id} />
            <button
              type="submit"
              className="rounded-md border border-red-200 bg-white px-2 py-1 text-xs font-medium text-red-600 transition hover:border-red-400 hover:text-red-700"
            >
              Remove
            </button>
          </form>
        </div>
      </div>
      <form action={updatePageAction} className="grid gap-3 sm:grid-cols-4">
        <input type="hidden" name="pageId" value={node.id} />
        <div className="sm:col-span-1">
          <label className="block text-xs font-medium uppercase tracking-wide text-slate-500">
            Title
          </label>
          <input
            name="title"
            defaultValue={node.title}
            className="mt-1 block w-full rounded-md border border-ds-border bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-ds-primary focus:outline-none focus:ring-2 focus:ring-ds-primary/20"
          />
        </div>
        <div className="sm:col-span-1">
          <label className="block text-xs font-medium uppercase tracking-wide text-slate-500">
            Slug
          </label>
          <input
            name="slug"
            defaultValue={node.slug}
            className="mt-1 block w-full rounded-md border border-ds-border bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-ds-primary focus:outline-none focus:ring-2 focus:ring-ds-primary/20"
          />
        </div>
        <div className="sm:col-span-1">
          <label className="block text-xs font-medium uppercase tracking-wide text-slate-500">
            Custom path
          </label>
          <input
            name="path"
            defaultValue={node.path}
            className="mt-1 block w-full rounded-md border border-ds-border bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-ds-primary focus:outline-none focus:ring-2 focus:ring-ds-primary/20"
          />
        </div>
        <div className="sm:col-span-1">
          <label className="block text-xs font-medium uppercase tracking-wide text-slate-500">
            Status
          </label>
          <select
            name="status"
            defaultValue={node.status}
            className="mt-1 block w-full rounded-md border border-ds-border bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-ds-primary focus:outline-none focus:ring-2 focus:ring-ds-primary/20"
          >
            <option value="draft">Draft</option>
            <option value="review">In review</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
        </div>
        <div className="sm:col-span-4">
          <button
            type="submit"
            className="inline-flex items-center rounded-md border border-ds-border bg-white px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600 transition hover:border-ds-primary hover:bg-ds-primary/10 hover:text-ds-primary"
          >
            Save metadata
          </button>
        </div>
      </form>

      {node.children.length > 0 ? (
        <div className="space-y-3">
          {node.children.map((child) => (
            <PageNode key={child.id} node={child} depth={depth + 1} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

interface FlatPage {
  id: string;
  title: string;
  path: string;
  status: PageTreeNode['status'];
  breadcrumbs: string[];
  depth: number;
}

function flattenTree(nodes: PageTreeNode[], breadcrumbs: string[] = [], depth = 0): FlatPage[] {
  return nodes.flatMap((node) => {
    const current: FlatPage = {
      id: node.id,
      title: node.title,
      path: node.path,
      status: node.status,
      breadcrumbs,
      depth
    };
    return [current, ...flattenTree(node.children, [...breadcrumbs, node.title], depth + 1)];
  });
}
