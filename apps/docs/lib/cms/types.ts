export type PageStatus = 'draft' | 'review' | 'published' | 'archived';

export type PageBlockKind = 'rich-text' | 'component';

export interface PageBlock {
  id: string;
  kind: PageBlockKind;
  html?: string;
  componentId?: string;
  props?: Record<string, unknown>;
}

export interface PageColumn {
  id: string;
  span: number; // 1 - 12 grid columns
  blocks: PageBlock[];
}

export interface PageSection {
  id: string;
  title?: string;
  columns: PageColumn[];
}

export interface PageRecord {
  id: string;
  title: string;
  slug: string;
  path: string;
  parentId: string | null;
  order: number;
  status: PageStatus;
  body?: string;
  sections: PageSection[];
  lastEditedBy?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PageRevisionRecord {
  id: string;
  pageId: string;
  version: number;
  title: string;
  summary?: string;
  body?: string;
  sections: PageSection[];
  status: PageStatus;
  createdAt: string;
  authorId: string;
}

export interface AssetRecord {
  id: string;
  filename: string;
  url: string;
  mimeType: string;
  size: number;
  createdAt: string;
  createdBy: string;
  tags?: string[];
}

export interface CmsData {
  pages: PageRecord[];
  revisions: PageRevisionRecord[];
  assets: AssetRecord[];
}

export interface PageTreeNode extends PageRecord {
  children: PageTreeNode[];
}
