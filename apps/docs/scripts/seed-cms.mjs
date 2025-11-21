import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { getMDXComponent } from 'next-contentlayer/hooks';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '../../..');
const cmsPath = path.join(repoRoot, 'data', 'cms.json');

const mdxComponents = {
  a: (props) => React.createElement('a', { ...props }),
  table: (props) => React.createElement('table', { ...props }),
  pre: (props) => React.createElement('pre', { ...props })
};

const readJsonDocs = async (dir) => {
  const entries = await fs.readdir(dir);
  const docs = await Promise.all(
    entries
      .filter((file) => file.endsWith('.json') && !file.startsWith('_'))
      .map(async (file) => {
        const raw = await fs.readFile(path.join(dir, file), 'utf8');
        return JSON.parse(raw);
      })
  );
  return docs;
};

const guideDocs = await readJsonDocs(path.join(repoRoot, 'apps/docs/.contentlayer/generated/GuideDoc'));
const componentDocs = await readJsonDocs(path.join(repoRoot, 'apps/docs/.contentlayer/generated/ComponentDoc'));

const SECTION_MAP = {
  About: 'about',
  Foundations: 'foundations',
  Components: 'components',
  Patterns: 'patterns',
  Accessibility: 'accessibility',
  Developers: 'developers',
  Changelog: 'changelog'
};

const orderedSectionKeys = ['About', 'Foundations', 'Components', 'Patterns', 'Accessibility', 'Developers'];

const sortByOrder = (docs) =>
  [...docs].sort((a, b) => {
    const orderA = a.order ?? Number.MAX_SAFE_INTEGER;
    const orderB = b.order ?? Number.MAX_SAFE_INTEGER;
    if (orderA !== orderB) return orderA - orderB;
    return (a.title ?? '').localeCompare(b.title ?? '');
  });

const mapGuideDocs = (guides) => {
  const grouped = new Map();
  sortByOrder(guides).forEach((doc) => {
    const key = doc.section;
    const href = doc.url ?? `/${SECTION_MAP[key]}/${doc.slug}`;
    const entry = {
      title: doc.title,
      href,
      slug: doc.slug,
      section: doc.section,
      doc
    };
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key).push(entry);
  });

  return Array.from(grouped.entries()).map(([section, items]) => ({
    id: SECTION_MAP[section] ?? section.toLowerCase(),
    title: section,
    href: `/${SECTION_MAP[section] ?? section.toLowerCase()}`,
    items
  }));
};

const mapComponentDocs = (components) => {
  const sorted = sortByOrder(components);
  const items = [
    {
      title: 'All Components',
      href: '/components',
      slug: 'index',
      section: 'Components',
      doc: null
    },
    ...sorted.map((component) => ({
      title: component.title,
      href: component.url ?? `/components/${component.slug}`,
      slug: component.slug,
      section: 'Components',
      doc: component
    }))
  ];

  return {
    id: 'components',
    title: 'Components',
    href: '/components',
    items
  };
};

const buildNavigation = () => {
  const components = mapComponentDocs(componentDocs);
  const others = mapGuideDocs(guideDocs);
  const aboutSection = {
    id: 'about',
    title: 'About',
    href: '/about',
    items: []
  };

  const sectionMap = new Map();
  others.forEach((section) => {
    if (section.title === 'Changelog') return;
    sectionMap.set(section.title, section);
  });
  sectionMap.set('Components', components);
  sectionMap.set('About', aboutSection);

  return orderedSectionKeys
    .map((key) => sectionMap.get(key))
    .filter(Boolean);
};

const navigation = buildNavigation();

const defaultData = {
  pages: [],
  revisions: [],
  assets: []
};

const readCmsData = async () => {
  try {
    const raw = await fs.readFile(cmsPath, 'utf8');
    return JSON.parse(raw);
  } catch {
    return defaultData;
  }
};

const writeCmsData = async (data) => {
  await fs.mkdir(path.dirname(cmsPath), { recursive: true });
  await fs.writeFile(cmsPath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
};

const renderMdxToHtml = (doc) => {
  if (!doc) return '';
  try {
    const Component = getMDXComponent(doc.body.code);
    const element = React.createElement(Component, { components: mdxComponents });
    return renderToStaticMarkup(element);
  } catch (error) {
    console.warn(`Failed to render MDX for ${doc.title ?? doc.slug}:`, error);
    return `<div><p><strong>${doc.title ?? doc.slug}</strong></p><p>Content could not be rendered automatically.</p></div>`;
  }
};

const toPageId = (prefix, key) => `${prefix}-${key.replace(/[^a-z0-9-]/gi, '-').toLowerCase()}`;

const createRichTextBlock = (html) => ({
  id: `block-${randomUUID()}`,
  kind: 'rich-text',
  html
});

const createColumn = (span, blocks) => ({
  id: `column-${randomUUID()}`,
  span,
  blocks
});

const createSection = (blocks) => ({
  id: `section-${randomUUID()}`,
  title: null,
  columns: [createColumn(12, blocks)]
});

const nowIso = () => new Date().toISOString();

const ensureSectionPage = (pages, section, order) => {
  const existing = pages.find((page) => page.path === section.href);
  if (existing) {
    return existing;
  }
  const body = renderSectionIntro(section);
  const page = {
    id: toPageId('section', section.id),
    title: section.title,
    slug: section.id,
    path: section.href,
    parentId: null,
    order,
    status: 'published',
    body,
    sections: [createSection([createRichTextBlock(body)])],
    lastEditedBy: null,
    createdAt: nowIso(),
    updatedAt: nowIso()
  };
  pages.push(page);
  return page;
};

const renderSectionIntro = (section) => {
  if (section.title === 'Components') {
    return `<section class="prose prose-slate max-w-none"><h1>${section.title}</h1><p>Browse component documentation sourced from MDX files. Use the editor to add CMS-managed announcements or contextual guidance.</p></section>`;
  }
  if (section.title === 'About') {
    return `<section class="prose prose-slate max-w-none"><h1>${section.title}</h1><p>This page is powered by the design system CMS. Customize it using the editor.</p></section>`;
  }
  return `<section class="prose prose-slate max-w-none"><h1>${section.title}</h1><p>Start curating content for the ${section.title.toLowerCase()} collection directly in the CMS.</p></section>`;
};

const ensureItemPage = (pages, sectionPage, item, order) => {
  const existing = pages.find((page) => page.path === item.href);
  if (existing) {
    const html = item.doc ? renderMdxToHtml(item.doc) : existing.body;
    if (html && html !== existing.body) {
      existing.body = html;
      existing.sections = [createSection([createRichTextBlock(html)])];
      existing.updatedAt = nowIso();
    }
    return existing;
  }
  const html = item.doc
    ? renderMdxToHtml(item.doc)
    : `<section class="prose prose-slate max-w-none"><h1>${item.title}</h1><p>Author this page in the CMS editor.</p></section>`;
  const page = {
    id: toPageId('page', `${sectionPage.slug ?? sectionPage.id}-${item.slug ?? item.title}`),
    title: item.title,
    slug: item.slug ?? item.title.replace(/\s+/g, '-').toLowerCase(),
    path: item.href,
    parentId: sectionPage.id,
    order,
    status: 'published',
    body: html,
    sections: [createSection([createRichTextBlock(html)])],
    lastEditedBy: null,
    createdAt: nowIso(),
    updatedAt: nowIso()
  };
  pages.push(page);
  return page;
};

const cmsData = await readCmsData();
const pages = [...(cmsData.pages ?? [])];

navigation.forEach((section, sectionIndex) => {
  const sectionPage = ensureSectionPage(pages, section, sectionIndex);
  section.items.forEach((item, itemIndex) => {
    ensureItemPage(pages, sectionPage, item, itemIndex);
  });
});

const normalizedPages = pages.sort((a, b) => {
  if ((a.parentId ?? null) === (b.parentId ?? null)) {
    return (a.order ?? 0) - (b.order ?? 0);
  }
  return (a.parentId ?? '').localeCompare(b.parentId ?? '');
});

await writeCmsData({
  ...cmsData,
  pages: normalizedPages
});

console.log(`Seeded CMS data for ${navigation.length} sections and their entries.`);
