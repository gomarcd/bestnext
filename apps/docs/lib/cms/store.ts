import { randomUUID } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';

import { getNavigation } from '@/lib/navigation';

import type { CmsData, PageRecord, PageSection, PageTreeNode, PageColumn, PageBlock } from './types';

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_PATH = path.join(DATA_DIR, 'cms.json');

const EMPTY_DATA: CmsData = {
  pages: [],
  revisions: [],
  assets: []
};

async function ensureDataFile(): Promise<void> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.access(DATA_PATH);
  } catch {
    const seed = await seedFromNavigation();
    await fs.writeFile(DATA_PATH, JSON.stringify(seed, null, 2), 'utf8');
  }
}

async function readStore(): Promise<CmsData> {
  await ensureDataFile();
  try {
    const raw = await fs.readFile(DATA_PATH, 'utf8');
    const data = JSON.parse(raw) as CmsData;
    return normalizeData(data);
  } catch (error) {
    console.error('Failed to load CMS store, reinitializing.', error);
    await fs.writeFile(DATA_PATH, JSON.stringify(EMPTY_DATA, null, 2), 'utf8');
    return EMPTY_DATA;
  }
}

async function writeStore(data: CmsData): Promise<void> {
  await ensureDataFile();
  const normalized = normalizeData(data);
  await fs.writeFile(DATA_PATH, JSON.stringify(normalized, null, 2), 'utf8');
}

function normalizeData(data: CmsData): CmsData {
  const pages = (data.pages ?? []).map((page) => {
    const sections = normalizeSections(page.sections, page.body);
    return {
      body: page.body ?? flattenSectionsToHtml(sections),
      sections,
      lastEditedBy: page.lastEditedBy ?? null,
      ...page
    };
  });

  const revisions = (data.revisions ?? []).map((revision) => {
    const sections = normalizeSections(revision.sections, revision.body);
    return {
      body: revision.body ?? flattenSectionsToHtml(sections),
      sections,
      ...revision
    };
  });

  return {
    pages,
    revisions,
    assets: data.assets ?? []
  };
}

async function seedFromNavigation(): Promise<CmsData> {
  const navigation = getNavigation();
  const now = new Date().toISOString();
  const pages: PageRecord[] = [];
  const seenPaths = new Map<string, string>();

  navigation.forEach((section, sectionIndex) => {
    const sectionId = `section-${section.id}`;
    const sectionPath = section.href ?? `/${section.id}`;

    const sectionRecord: PageRecord = {
      id: sectionId,
      title: section.title,
      slug: section.id,
      path: sectionPath,
      parentId: null,
      order: sectionIndex,
      status: 'published',
      body: '',
      sections: [],
      lastEditedBy: null,
      createdAt: now,
      updatedAt: now
    };

    pages.push(sectionRecord);
    seenPaths.set(sectionPath, sectionId);

    section.items.forEach((item, itemIndex) => {
      const pagePath = item.href ?? `${sectionPath}/${item.title.toLowerCase().replace(/\s+/g, '-')}`;

      if (seenPaths.has(pagePath)) {
        return;
      }

      const pageId = `page-${section.id}-${item.slug ?? item.title.replace(/\s+/g, '-').toLowerCase()}`;

      const record: PageRecord = {
        id: pageId,
        title: item.title,
        slug: item.href?.split('/').filter(Boolean).pop() ?? item.title.replace(/\s+/g, '-').toLowerCase(),
        path: pagePath,
        parentId: sectionId,
        order: itemIndex,
        status: 'published',
        body: '',
        sections: [],
        lastEditedBy: null,
        createdAt: now,
        updatedAt: now
      };

      pages.push(record);
      seenPaths.set(pagePath, pageId);
    });
  });

  return {
    pages,
    revisions: [],
    assets: []
  };
}

export async function getCmsData(): Promise<CmsData> {
  return readStore();
}

export async function saveCmsData(data: CmsData): Promise<void> {
  await writeStore(data);
}

export async function ensureCmsData(): Promise<CmsData> {
  await ensureDataFile();
  const data = await readStore();
  if (data.pages.length === 0) {
    const seeded = await seedFromNavigation();
    await writeStore(seeded);
    return seeded;
  }
  return data;
}

export function buildPageTree(pages: PageRecord[]): PageTreeNode[] {
  const byId = new Map<string, PageTreeNode>();
  const roots: PageTreeNode[] = [];

  pages
    .sort((a, b) => {
      if (a.parentId === b.parentId) {
        return a.order - b.order;
      }
      return (a.parentId ?? '').localeCompare(b.parentId ?? '');
    })
    .forEach((page) => {
      const node: PageTreeNode = { ...page, children: [] };
      byId.set(page.id, node);
    });

  byId.forEach((node) => {
    if (node.parentId) {
      const parent = byId.get(node.parentId);
      if (parent) {
        parent.children.push(node);
        parent.children.sort((a, b) => a.order - b.order);
      } else {
        roots.push(node);
      }
    } else {
      roots.push(node);
    }
  });

  return roots.sort((a, b) => a.order - b.order);
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

  // Legacy flat section
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
    return [createRichTextBlock('<p class="text-slate-500">Start typing to add content…</p>')];
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
    columns: [createColumn(12, [createRichTextBlock('<p class="text-slate-500">Start typing to add content…</p>')])]
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
