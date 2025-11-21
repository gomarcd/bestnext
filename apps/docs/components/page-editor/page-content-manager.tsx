'use client';

import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';

import type { PageSection } from '@/lib/cms/types';

import { PageEditorCanvas } from './page-editor-canvas';

interface PageContentManagerProps {
  path: string;
  editMode: boolean;
  exitHref: string;
  settingsHref: string;
  children: ReactNode;
}

interface PagePayload {
  id: string;
  title: string;
  body?: string;
  sections?: PageSection[];
}

const createId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2);
};

const createRichTextSection = (html: string): PageSection => ({
  id: `section-${createId()}`,
  columns: [
    {
      id: `column-${createId()}`,
      span: 12,
      blocks: [
        {
          id: `block-${createId()}`,
          kind: 'rich-text',
          html
        }
      ]
    }
  ]
});

export function PageContentManager({ path, editMode, exitHref, settingsHref, children }: PageContentManagerProps) {
  const [page, setPage] = useState<PagePayload | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const hasRenderableSections =
    page?.sections?.some((section) =>
      section.columns.some((column) =>
        column.blocks.some((block) => {
          if (block.kind === 'component') {
            return true;
          }
          if (block.kind === 'rich-text') {
            const html = block.html ?? '';
            return html.replace(/<[^>]*>/g, '').trim().length > 0;
          }
          return false;
        })
      )
    ) ?? false;

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    async function load() {
      setIsLoading(true);
      setError(null);
      setPage(null);
      try {
        const response = await fetch(`/api/admin/pages/by-path?path=${encodeURIComponent(path)}`, {
          method: 'GET',
          signal: controller.signal,
          credentials: 'include'
        });

        if (!response.ok) {
          if (response.status === 401) {
            if (!cancelled) {
              setPage(null);
            }
            return;
          }
          const data = await response.json().catch(() => ({}));
          throw new Error(data.error ?? 'Failed to fetch page data.');
        }

        const data = (await response.json()) as { page: PagePayload };
        if (!cancelled) {
          const normalizedSections =
            data.page.sections && data.page.sections.length
              ? data.page.sections
              : data.page.body
                ? [createRichTextSection(data.page.body)]
                : [];
          if (process.env.NODE_ENV !== 'production') {
            console.debug('[PageContentManager] Loaded CMS page', path, {
              hasSections: normalizedSections.length > 0,
              sectionCount: normalizedSections.length,
              bodyLength: data.page.body?.length ?? 0
            });
          }
          setPage({ ...data.page, sections: normalizedSections });
        }
      } catch (err) {
        if (!cancelled) {
          setPage(null);
          setError(err instanceof Error ? err.message : 'Unexpected error');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [path]);

  if (editMode) {
    if (isLoading && !page) {
      return (
        <div className="rounded-2xl border border-ds-border bg-white p-6 text-sm text-slate-600 shadow-sm">
          Loading editor…
        </div>
      );
    }

    if (error) {
      return (
        <div className="rounded-2xl border border-red-300 bg-red-50 p-6 text-sm text-red-700 shadow-sm">
          {error}
        </div>
      );
    }

    if (!page) {
      return (
        <div className="rounded-2xl border border-red-300 bg-red-50 p-6 text-sm text-red-700 shadow-sm">
          Page metadata could not be resolved for <code>{path}</code>. Ensure it is tracked in the Pages dashboard.
        </div>
      );
    }

    return (
      <PageEditorCanvas
        path={path}
        initialTitle={page.title}
        sections={page.sections ?? []}
        exitHref={exitHref}
        settingsHref={settingsHref}
        onSaved={(next) =>
          setPage((prev) =>
            prev
              ? {
                  ...prev,
                  title: next.title,
                  body: next.body,
                  sections: next.sections ?? []
                }
              : prev
          )
        }
        source={children}
      />
    );
  }

  if (!editMode && page && hasRenderableSections) {
    return (
      <div className="space-y-10">
        {page.sections.map((section) => (
          <div key={section.id} className="grid grid-cols-12 gap-6">
            {section.columns.map((column) => (
              <div key={column.id} className="space-y-6" style={{ gridColumn: `span ${column.span} / span ${column.span}` }}>
                {column.blocks.map((block) =>
                  block.kind === 'component' ? (
                    <div key={block.id} className="rounded-xl border border-ds-border bg-white p-6 shadow-sm">
                      <p className="text-sm font-semibold text-slate-700">Component: {block.componentId ?? 'Unknown'}</p>
                      <p className="text-xs text-slate-500">Rendering coming soon.</p>
                    </div>
                  ) : (
                    <div
                      key={block.id}
                      className="prose prose-slate max-w-none"
                      dangerouslySetInnerHTML={{ __html: block.html ?? '' }}
                    />
                  )
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  }

  return <>{children}</>;
}
