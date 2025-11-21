#!/usr/bin/env node

const fs = require('node:fs/promises');
const path = require('node:path');
const { randomUUID } = require('node:crypto');

async function main() {
  const dataPath = path.join(process.cwd(), 'data', 'cms.json');
  const raw = await fs.readFile(dataPath, 'utf8');
  const data = JSON.parse(raw);

  const navigation = await buildNavigation();
  const now = new Date().toISOString();

  const existingByPath = new Map(
    (data.pages ?? []).map((page) => [normalizePath(page.path), { ...page, sections: page.sections ?? [] }])
  );

  const usedPaths = new Set();
  const nextPages = [];

  const ensurePage = (pagePath, config = {}) => {
    const normalizedPath = normalizePath(pagePath);

    if (usedPaths.has(normalizedPath)) {
      return existingByPath.get(normalizedPath);
    }

    const existing = existingByPath.get(normalizedPath);
    let record;

    if (existing) {
      record = {
        ...existing,
        title: config.title ?? existing.title,
        slug: existing.slug ?? config.slug ?? slugFromPath(normalizedPath),
        path: normalizedPath,
        parentId: config.parentId !== undefined ? config.parentId : existing.parentId ?? null,
        order: config.order !== undefined ? config.order : existing.order ?? 0,
        status: existing.status ?? 'published',
        sections: Array.isArray(existing.sections) ? existing.sections : [],
        body: existing.body ?? '',
        lastEditedBy: existing.lastEditedBy ?? null,
        createdAt: existing.createdAt ?? now,
        updatedAt: config.touch ? now : existing.updatedAt ?? now
      };
    } else {
      const slug = config.slug ?? slugFromPath(normalizedPath);
      record = {
        id: config.id ?? `page-${slug || randomUUID()}`,
        title: config.title ?? titleFromSlug(slug),
        slug,
        path: normalizedPath,
        parentId: config.parentId ?? null,
        order: config.order ?? 0,
        status: config.status ?? 'published',
        sections: config.sections ?? [],
        body: config.body ?? '',
        lastEditedBy: null,
        createdAt: now,
        updatedAt: now
      };
    }

    usedPaths.add(normalizedPath);
    nextPages.push(record);
    return record;
  };

  // Ensure home exists first
  ensurePage('/', {
    id: existingByPath.get('/')?.id ?? 'page-home',
    title: 'Home',
    slug: 'home',
    order: 0,
    parentId: null
  });

  const seenPaths = new Set(['/']);

  navigation.forEach((section, sectionIndex) => {
    const sectionPath = normalizePath(section.href ?? `/${section.id}`);
    const parentRecord = ensurePage(sectionPath, {
      id: existingByPath.get(sectionPath)?.id ?? `section-${slugFromPath(sectionPath)}`,
      title: section.title,
      slug: slugFromPath(sectionPath) || section.id,
      parentId: null,
      order: sectionIndex + 1
    });
    seenPaths.add(sectionPath);

    section.items.forEach((item, itemIndex) => {
      const itemPath = normalizePath(item.href ?? `${sectionPath}/${slugify(item.title)}`);
      if (seenPaths.has(itemPath)) {
        return;
      }
      ensurePage(itemPath, {
        id: existingByPath.get(itemPath)?.id ?? `page-${slugFromPath(itemPath)}`,
        title: item.title,
        slug: slugFromPath(itemPath),
        parentId: parentRecord?.id ?? null,
        order: itemIndex
      });
      seenPaths.add(itemPath);
    });
  });

  // Preserve any additional pages that are not part of the primary navigation
  existingByPath.forEach((page, pathKey) => {
    if (!usedPaths.has(pathKey)) {
      nextPages.push(page);
      usedPaths.add(pathKey);
    }
  });

  nextPages.sort((a, b) => {
    const parentA = a.parentId ?? '';
    const parentB = b.parentId ?? '';
    if (parentA === parentB) {
      return (a.order ?? 0) - (b.order ?? 0);
    }
    return parentA.localeCompare(parentB);
  });

  const updatedData = {
    ...data,
    pages: nextPages
  };

  await fs.writeFile(dataPath, JSON.stringify(updatedData, null, 2));
}

async function buildNavigation() {
  const guideDocs = await loadContentlayerIndex('GuideDoc');
  const componentDocs = await loadContentlayerIndex('ComponentDoc');

  const groupedGuides = new Map();

  guideDocs.forEach((doc) => {
    const section = doc.section ?? 'Other';
    if (!groupedGuides.has(section)) {
      groupedGuides.set(section, []);
    }
    groupedGuides.get(section).push({
      title: doc.title,
      href: normalizePath(doc.url ?? `/${doc._raw?.flattenedPath ?? ''}`),
      description: doc.description ?? '',
      order: doc.order ?? Number.MAX_SAFE_INTEGER
    });
  });

  groupedGuides.forEach((items) => {
    items.sort((a, b) => {
      const orderA = a.order ?? Number.MAX_SAFE_INTEGER;
      const orderB = b.order ?? Number.MAX_SAFE_INTEGER;
      if (orderA !== orderB) return orderA - orderB;
      return a.title.localeCompare(b.title);
    });
  });

  const componentItems = componentDocs
    .map((component) => ({
      title: component.title,
      href: normalizePath(component.url ?? `/components/${component.id}`),
      description: component.summary ?? '',
      status: component.status ?? ''
    }))
    .sort((a, b) => a.title.localeCompare(b.title));

  return [
    { id: 'about', title: 'About', href: '/about', items: [] },
    { id: 'foundations', title: 'Foundations', href: '/foundations', items: groupedGuides.get('Foundations') ?? [] },
    {
      id: 'components',
      title: 'Components',
      href: '/components',
      items: [{ title: 'All Components', href: '/components' }, ...componentItems]
    },
    { id: 'patterns', title: 'Patterns', href: '/patterns', items: groupedGuides.get('Patterns') ?? [] },
    { id: 'accessibility', title: 'Accessibility', href: '/accessibility', items: groupedGuides.get('Accessibility') ?? [] },
    { id: 'developers', title: 'Developers', href: '/developers', items: groupedGuides.get('Developers') ?? [] },
    { id: 'changelog', title: 'Changelog', href: '/changelog', items: groupedGuides.get('Changelog') ?? [] }
  ];
}

async function loadContentlayerIndex(kind) {
  const indexPath = path.join(process.cwd(), `apps/docs/.contentlayer/generated/${kind}/_index.json`);
  const raw = await fs.readFile(indexPath, 'utf8');
  return JSON.parse(raw);
}

function normalizePath(value) {
  if (!value) return '/';
  let pathValue = value;
  if (!pathValue.startsWith('/')) {
    pathValue = `/${pathValue}`;
  }
  if (pathValue.length > 1 && pathValue.endsWith('/')) {
    pathValue = pathValue.slice(0, -1);
  }
  return pathValue;
}

function slugFromPath(pathValue) {
  const segments = normalizePath(pathValue)
    .split('/')
    .filter(Boolean);
  if (segments.length === 0) {
    return 'home';
  }
  return segments[segments.length - 1];
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

function titleFromSlug(slug) {
  return slug
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
