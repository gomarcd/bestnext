'use server';

import { randomUUID } from 'node:crypto';

import { revalidatePath } from 'next/cache';
import React from 'react';
import { ensureCmsData, saveCmsData, buildPageTree } from './store';
import type {
  PageRecord,
  PageRevisionRecord,
  PageSection,
  PageStatus,
  PageTreeNode,
  PageColumn,
  PageBlock,
  CmsData
} from './types';
import type { NavItem, NavSection } from '@/lib/navigation';
import { getNavigation } from '@/lib/navigation';
import type { ComponentDoc, GuideDoc } from 'contentlayer/generated';
import { allComponentDocs, allGuideDocs } from 'contentlayer/generated';

const ROOT_PARENT = null;

export interface CreatePageInput {
  title: string;
  slug?: string;
  path?: string;
  parentId?: string | null;
  status?: PageStatus;
  order?: number;
  body?: string;
  sections?: PageSection[];
}

export interface UpdatePageInput {
  pageId: string;
  title?: string;
  slug?: string;
  path?: string;
  status?: PageStatus;
}

export interface MovePageInput {
  pageId: string;
  direction: 'up' | 'down';
}

export interface UpdatePageContentInput {
  pageId: string;
  body: string;
  authorId?: string | null;
}

export async function getPageTree(): Promise<PageTreeNode[]> {
  const data = await ensureCmsData();
  return buildPageTree(data.pages);
}

export async function createPage(input: CreatePageInput): Promise<PageRecord> {
  const now = new Date().toISOString();
  const data = await ensureCmsData();

  const parentId = input.parentId ?? ROOT_PARENT;
  const siblings = data.pages.filter((page) => (page.parentId ?? null) === (parentId ?? null));

  const order = input.order ?? siblings.length;

  const slug = input.slug ?? slugify(input.title);
  const path = input.path ?? buildPath(parentId, slug, data.pages);
  const sections = normalizeSections(input.sections, input.body);

  const record: PageRecord = {
    id: randomUUID(),
    title: input.title,
    slug,
    path,
    parentId,
    order,
    status: input.status ?? 'draft',
    body: flattenSectionsToHtml(sections),
    sections,
    lastEditedBy: null,
    createdAt: now,
    updatedAt: now
  };

  const updatedPages = [...data.pages, record].map((page) => {
    if ((page.parentId ?? null) !== (parentId ?? null)) {
      return page;
    }
    if (page.id === record.id) {
      return record;
    }
    if (page.order >= order) {
      return { ...page, order: page.order + 1 };
    }
    return page;
  });

  await saveCmsData({ ...data, pages: updatedPages });
  revalidateCmsPaths(record.id);
  return record;
}

export async function updatePage(input: UpdatePageInput): Promise<PageRecord | null> {
  const data = await ensureCmsData();
  const page = data.pages.find((candidate) => candidate.id === input.pageId);

  if (!page) {
    return null;
  }

  const now = new Date().toISOString();
  const patch: Partial<PageRecord> = {
    title: input.title ?? page.title,
    slug: input.slug ?? page.slug,
    path: input.path ?? page.path,
    status: input.status ?? page.status,
    updatedAt: now
  };

  const updatedPage: PageRecord = { ...page, ...patch };
  const pages = data.pages.map((candidate) => (candidate.id === updatedPage.id ? updatedPage : candidate));

  await saveCmsData({ ...data, pages });
  revalidateCmsPaths(updatedPage.id);
  return updatedPage;
}

export async function updatePageContent(input: UpdatePageContentInput): Promise<PageRecord | null> {
  const data = await ensureCmsData();
  const pageIndex = data.pages.findIndex((candidate) => candidate.id === input.pageId);

  if (pageIndex === -1) {
    return null;
  }

  const page = data.pages[pageIndex];
  const now = new Date().toISOString();
  const authorId = input.authorId ?? 'unknown';
  const sections = normalizeSections(page.sections, input.body);
  if (sections.length === 0) {
    sections.push(createEmptySection());
  }
  const firstSection = sections[0];
  if (!firstSection.columns.length) {
    firstSection.columns.push(createColumn(12, []));
  }
  const firstColumn = firstSection.columns[0];
  if (!firstColumn.blocks.length || firstColumn.blocks[0].kind !== 'rich-text') {
    firstColumn.blocks.unshift(createRichTextBlock(input.body));
  } else {
    firstColumn.blocks[0] = { ...firstColumn.blocks[0], html: input.body };
  }

  const updatedPage: PageRecord = {
    ...page,
    body: flattenSectionsToHtml(sections),
    sections,
    lastEditedBy: authorId,
    updatedAt: now
  };

  const nextVersion =
    data.revisions.filter((revision) => revision.pageId === page.id).reduce((max, revision) => Math.max(max, revision.version), 0) + 1;

  const revision: PageRevisionRecord = {
    id: randomUUID(),
    pageId: page.id,
    version: nextVersion,
    title: updatedPage.title,
    body: flattenSectionsToHtml(sections),
    sections,
    status: updatedPage.status,
    createdAt: now,
    authorId
  };

  const pages = [...data.pages];
  pages[pageIndex] = updatedPage;
  const revisions = [...data.revisions, revision];

  await saveCmsData({ ...data, pages, revisions });
  revalidateCmsPaths(page.id);
  return updatedPage;
}

export async function movePage({ pageId, direction }: MovePageInput): Promise<PageRecord | null> {
  const data = await ensureCmsData();
  const page = data.pages.find((candidate) => candidate.id === pageId);

  if (!page) {
    return null;
  }

  const siblings = data.pages
    .filter((candidate) => (candidate.parentId ?? null) === (page.parentId ?? null))
    .sort((a, b) => a.order - b.order);

  const currentIndex = siblings.findIndex((candidate) => candidate.id === pageId);

  if (currentIndex === -1) {
    return null;
  }

  const swapIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

  if (swapIndex < 0 || swapIndex >= siblings.length) {
    return page;
  }

  const target = siblings[swapIndex];

  const updatedPages = data.pages.map((candidate) => {
    if (candidate.id === page.id) {
      return { ...candidate, order: target.order };
    }
    if (candidate.id === target.id) {
      return { ...candidate, order: page.order };
    }
    return candidate;
  });

  await saveCmsData({ ...data, pages: updatedPages });
  revalidateCmsPaths(page.id);

  return { ...page, order: target.order };
}

export async function deletePage(pageId: string): Promise<void> {
  const data = await ensureCmsData();
  const toRemove = new Set<string>();

  function collect(id: string): void {
    toRemove.add(id);
    data.pages
      .filter((candidate) => candidate.parentId === id)
      .forEach((child) => collect(child.id));
  }

  collect(pageId);

  const pages = data.pages.filter((candidate) => !toRemove.has(candidate.id));
  const revisions = data.revisions.filter((revision) => !toRemove.has(revision.pageId));

  await saveCmsData({ ...data, pages, revisions });
  revalidateCmsPaths(pageId);
}

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

function buildPath(parentId: string | null, slug: string, pages: PageRecord[]): string {
  if (!parentId) {
    return `/${slug}`;
  }

  const parent = pages.find((candidate) => candidate.id === parentId);
  if (!parent) {
    return `/${slug}`;
  }

  return `${parent.path.replace(/\/$/, '')}/${slug}`;
}

function revalidateCmsPaths(pageId?: string): void {
  revalidatePath('/admin');
  revalidatePath('/admin/pages');
  if (pageId) {
    revalidatePath(`/admin/pages/${pageId}`);
  }
}

export async function getPageById(pageId: string): Promise<PageRecord | null> {
  const data = await ensureCmsData();
  return data.pages.find((page) => page.id === pageId) ?? null;
}

export async function getPageByPath(path: string): Promise<PageRecord | null> {
  const data = await ensureCmsData();
  return data.pages.find((page) => page.path === path) ?? null;
}

export async function updatePageSections(input: {
  pageId: string;
  sections: PageSection[];
  title?: string;
  authorId?: string | null;
}): Promise<PageRecord | null> {
  const data = await ensureCmsData();
  const pageIndex = data.pages.findIndex((candidate) => candidate.id === input.pageId);

  if (pageIndex === -1) {
    return null;
  }

  const page = data.pages[pageIndex];
  const now = new Date().toISOString();
  const authorId = input.authorId ?? 'unknown';
  const sections = normalizeSections(input.sections);

  const updatedPage: PageRecord = {
    ...page,
    title: input.title ?? page.title,
    sections,
    body: flattenSectionsToHtml(sections),
    lastEditedBy: authorId,
    updatedAt: now
  };

  const nextVersion =
    data.revisions.filter((revision) => revision.pageId === page.id).reduce((max, revision) => Math.max(max, revision.version), 0) + 1;

  const revision: PageRevisionRecord = {
    id: randomUUID(),
    pageId: page.id,
    version: nextVersion,
    title: updatedPage.title,
    body: updatedPage.body,
    sections,
    status: updatedPage.status,
    createdAt: now,
    authorId
  };

  const pages = [...data.pages];
  pages[pageIndex] = updatedPage;
  const revisions = [...data.revisions, revision];

  await saveCmsData({ ...data, pages, revisions });
  revalidateCmsPaths(page.id);
  return updatedPage;
}

export async function getPageRevisions(pageId: string): Promise<PageRevisionRecord[]> {
  const data = await ensureCmsData();
  return data.revisions
    .filter((revision) => revision.pageId === pageId)
    .sort((a, b) => (b.version ?? 0) - (a.version ?? 0));
}

const mdxComponents = {
  a: (props: React.ComponentProps<'a'>) => React.createElement('a', props),
  table: (props: React.ComponentProps<'table'>) => React.createElement('table', props),
  pre: (props: React.ComponentProps<'pre'>) => React.createElement('pre', props)
};

const guideDocsByPath = new Map<string, GuideDoc>();
const componentDocsByPath = new Map<string, ComponentDoc>();

allGuideDocs.forEach((doc) => {
  const path = doc.url ?? `/${doc.section.toLowerCase()}/${doc.slug}`;
  guideDocsByPath.set(path, doc);
});

allComponentDocs.forEach((doc) => {
  const path = doc.url ?? `/components/${doc.slug}`;
  componentDocsByPath.set(path, doc);
});

async function renderDocToHtml(doc: { body: { code: string }; title: string }): Promise<string> {
  try {
    const [{ renderToStaticMarkup }, { getMDXComponent }] = await Promise.all([
      import('react-dom/server'),
      import('next-contentlayer/hooks')
    ]);
    const Component = getMDXComponent(doc.body.code);
    const element = React.createElement(Component, { components: mdxComponents });
    return renderToStaticMarkup(element);
  } catch (error) {
    console.error(`Failed to render MDX for ${doc.title}:`, error);
    return `<section class="prose prose-slate max-w-none"><h1>${doc.title}</h1><p>Content could not be rendered automatically.</p></section>`;
  }
}

const defaultSectionCopy: Record<string, string> = {
  Foundations: '<section class="prose prose-slate max-w-none"><h1>Foundations</h1><p>Start curating content for the foundations collection directly in the CMS.</p></section>',
  Components: '<section class="prose prose-slate max-w-none"><h1>Components</h1><p>Browse component documentation sourced from MDX files. Use the editor to add CMS-managed announcements or contextual guidance.</p></section>',
  Patterns: '<section class="prose prose-slate max-w-none"><h1>Patterns</h1><p>Organize reusable flows and usage guidance here.</p></section>',
  Accessibility: '<section class="prose prose-slate max-w-none"><h1>Accessibility</h1><p>Capture accessibility checklists, testing guidance, and policies.</p></section>',
  Developers: '<section class="prose prose-slate max-w-none"><h1>Developers</h1><p>Centralize implementation steps, starter kits, and platform notes.</p></section>'
};

function findNavigationEntry(path: string): { kind: 'section'; section: NavSection; sectionIndex: number } | { kind: 'item'; section: NavSection; sectionIndex: number; item: NavItem; itemIndex: number } | null {
  const navigation = getNavigation();

  for (let sectionIndex = 0; sectionIndex < navigation.length; sectionIndex += 1) {
    const section = navigation[sectionIndex];
    if (section.href === path) {
      return { kind: 'section', section, sectionIndex };
    }
    const itemIndex = section.items.findIndex((item) => item.href === path);
    if (itemIndex !== -1) {
      return { kind: 'item', section, sectionIndex, item: section.items[itemIndex], itemIndex };
    }
  }

  return null;
}

function renderSectionHtml(section: NavSection): string {
  return (
    defaultSectionCopy[section.title] ??
    `<section class="prose prose-slate max-w-none"><h1>${section.title}</h1><p>Use this space to introduce the ${section.title.toLowerCase()} section.</p></section>`
  );
}

async function getDocHtmlForPath(path: string): Promise<string | null> {
  const guideDoc = guideDocsByPath.get(path);
  if (guideDoc) {
    return renderDocToHtml(guideDoc);
  }
  const componentDoc = componentDocsByPath.get(path);
  if (componentDoc) {
    return renderDocToHtml(componentDoc);
  }
  return null;
}

function toPageId(prefix: string, key: string): string {
  return `${prefix}-${key.replace(/[^a-z0-9-]/gi, '-').toLowerCase()}`;
}

function sortPages(pages: PageRecord[]): PageRecord[] {
  return [...pages].sort((a, b) => {
    if ((a.parentId ?? null) === (b.parentId ?? null)) {
      return (a.order ?? 0) - (b.order ?? 0);
    }
    return (a.parentId ?? '').localeCompare(b.parentId ?? '');
  });
}

async function ensureSectionPageRecord(data: CmsData, section: NavSection, sectionIndex: number): Promise<{ record: PageRecord; data: CmsData }> {
  const existing = data.pages.find((candidate) => candidate.path === section.href);
  if (existing) {
    return { record: existing, data };
  }

  const html = renderSectionHtml(section);
  const now = new Date().toISOString();
  const record: PageRecord = {
    id: toPageId('section', section.id),
    title: section.title,
    slug: section.id,
    path: section.href ?? `/${section.id}`,
    parentId: null,
    order: sectionIndex,
    status: 'published',
    body: html,
    sections: [createSectionFromHtml(html)],
    lastEditedBy: null,
    createdAt: now,
    updatedAt: now
  };

  const pages = sortPages([...data.pages, record]);
  const updated: CmsData = { ...data, pages };
  await saveCmsData(updated);
  revalidateCmsPaths(record.id);
  return { record, data: updated };
}

async function ensureItemPageRecord(
  data: CmsData,
  sectionRecord: PageRecord,
  section: NavSection,
  item: NavItem,
  itemIndex: number
): Promise<{ record: PageRecord; data: CmsData }> {
  const existing = data.pages.find((candidate) => candidate.path === item.href);
  const html =
    (await getDocHtmlForPath(item.href ?? '')) ??
    `<section class="prose prose-slate max-w-none"><h1>${item.title}</h1><p>Add content using the editor.</p></section>`;
  const now = new Date().toISOString();

  if (existing) {
    const shouldUpdate = (existing.body ?? '') !== html || existing.sections.length === 0;
    if (!shouldUpdate) {
      return { record: existing, data };
    }

    const updatedRecord: PageRecord = {
      ...existing,
      title: item.title,
      body: html,
      sections: [createSectionFromHtml(html)],
      updatedAt: now
    };

    const pages = data.pages.map((candidate) => (candidate.id === updatedRecord.id ? updatedRecord : candidate));
    const updated: CmsData = { ...data, pages };
    await saveCmsData(updated);
    revalidateCmsPaths(updatedRecord.id);
    return { record: updatedRecord, data: updated };
  }

  const slug = item.href?.split('/').filter(Boolean).pop() ?? slugify(item.title);
  const record: PageRecord = {
    id: toPageId('page', `${section.id}-${slug}`),
    title: item.title,
    slug,
    path: item.href ?? `${sectionRecord.path.replace(/\/$/, '')}/${slug}`,
    parentId: sectionRecord.id,
    order: itemIndex,
    status: 'published',
    body: html,
    sections: [createSectionFromHtml(html)],
    lastEditedBy: null,
    createdAt: now,
    updatedAt: now
  };

  const pages = sortPages([...data.pages, record]);
  const updated: CmsData = { ...data, pages };
  await saveCmsData(updated);
  revalidateCmsPaths(record.id);
  return { record, data: updated };
}

export async function ensurePageByPath(path: string): Promise<PageRecord | null> {
  const normalizedPath = path === '' ? '/' : path;
  const data = await ensureCmsData();
  const existing = data.pages.find((candidate) => candidate.path === normalizedPath);
  if (existing) {
    return existing;
  }

  const entry = findNavigationEntry(normalizedPath);
  if (!entry) {
    return null;
  }

  if (entry.kind === 'section') {
    const result = await ensureSectionPageRecord(data, entry.section, entry.sectionIndex);
    return result.record;
  }

  const sectionResult = await ensureSectionPageRecord(data, entry.section, entry.sectionIndex);
  const itemResult = await ensureItemPageRecord(sectionResult.data, sectionResult.record, entry.section, entry.item, entry.itemIndex);
  return itemResult.record;
}

export async function restorePageRevision({
  pageId,
  revisionId,
  authorId
}: {
  pageId: string;
  revisionId: string;
  authorId?: string | null;
}): Promise<PageRecord | null> {
  const revisions = await getPageRevisions(pageId);
  const revision = revisions.find((entry) => entry.id === revisionId);
  if (!revision) {
    return null;
  }
  return updatePageSections({
    pageId,
    sections: revision.sections,
    title: revision.title,
    authorId
  });
}

function normalizeSections(sections?: PageSection[], fallbackBody?: string): PageSection[] {
  if (sections && sections.length > 0) {
    return sections.map((section) => normalizeSection(section));
  }

  if (fallbackBody && fallbackBody.trim().length > 0) {
    return [createSectionFromHtml(fallbackBody)];
  }

  return [createEmptySection()];
}

function normalizeSection(section: PageSection | LegacySection): PageSection {
  if ('columns' in section && Array.isArray(section.columns)) {
    return {
      id: section.id ?? `section-${randomUUID()}`,
      title: section.title,
      columns: normalizeColumns(section.columns)
    };
  }

  const legacy = section as LegacySection;
  if (legacy.kind === 'component') {
    return createComponentSection(legacy.componentId ?? '');
  }

  return createSectionFromHtml(legacy.html ?? '');
}

function normalizeColumns(columns?: PageColumn[]): PageColumn[] {
  if (!columns || columns.length === 0) {
    return [createColumn(12, [createRichTextBlock('')])];
  }

  return columns.map((column) => ({
    id: column.id ?? `column-${randomUUID()}`,
    span: clampSpan(column.span ?? 12),
    blocks: normalizeBlocks(column.blocks)
  }));
}

function normalizeBlocks(blocks?: PageBlock[]): PageBlock[] {
  if (!blocks || blocks.length === 0) {
    return [createRichTextBlock('')];
  }

  return blocks.map((block) => {
    if (block.kind === 'component') {
      return {
        id: block.id ?? `block-${randomUUID()}`,
        kind: 'component',
        componentId: block.componentId ?? '',
        props: block.props ?? {}
      };
    }

    return {
      id: block.id ?? `block-${randomUUID()}`,
      kind: 'rich-text',
      html: block.html ?? '',
      props: block.props ?? {}
    };
  });
}

function flattenSectionsToHtml(sections: PageSection[]): string {
  return sections
    .map((section) =>
      section.columns
        .map((column) =>
          column.blocks
            .map((block) => (block.kind === 'component' ? `<div data-component="${block.componentId ?? ''}"></div>` : block.html ?? ''))
            .join('\n')
        )
        .join('\n')
    )
    .join('\n');
}

function createEmptySection(): PageSection {
  return {
    id: `section-${randomUUID()}`,
    columns: [createColumn(12, [createRichTextBlock('')])]
  };
}

function createSectionFromHtml(html: string): PageSection {
  return {
    id: `section-${randomUUID()}`,
    columns: [createColumn(12, [createRichTextBlock(html)])]
  };
}

function createComponentSection(componentId: string): PageSection {
  return {
    id: `section-${randomUUID()}`,
    columns: [createColumn(12, [createComponentBlock(componentId)])]
  };
}

function createColumn(span: number, blocks: PageBlock[]): PageColumn {
  return {
    id: `column-${randomUUID()}`,
    span: clampSpan(span),
    blocks
  };
}

function createRichTextBlock(html: string): PageBlock {
  return {
    id: `block-${randomUUID()}`,
    kind: 'rich-text',
    html
  };
}

function createComponentBlock(componentId: string): PageBlock {
  return {
    id: `block-${randomUUID()}`,
    kind: 'component',
    componentId,
    props: {}
  };
}

function clampSpan(span: number): number {
  if (!Number.isFinite(span)) {
    return 12;
  }
  return Math.min(12, Math.max(1, Math.floor(span)));
}

type LegacySection = {
  id?: string;
  kind?: 'rich-text' | 'component';
  html?: string;
  componentId?: string;
  props?: Record<string, unknown>;
  columns?: unknown;
};
