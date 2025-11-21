import {
  allComponentDocs,
  allGuideDocs,
  type ComponentDoc,
  type GuideDoc
} from 'contentlayer/generated';

export interface NavItem {
  title: string;
  href: string;
  description?: string;
  status?: ComponentDoc['status'];
  tags?: string[];
  children?: NavItem[];
}

export interface NavSection {
  id: string;
  title: string;
  href?: string;
  items: NavItem[];
}

const SECTION_MAP: Record<string, string> = {
  About: 'about',
  Foundations: 'foundations',
  Patterns: 'patterns',
  Accessibility: 'accessibility',
  Developers: 'developers',
  Changelog: 'changelog'
};

const sortByOrder = <T extends { order?: number; title?: string }>(docs: T[]) =>
  [...docs].sort((a, b) => {
    const orderA = a.order ?? Number.MAX_SAFE_INTEGER;
    const orderB = b.order ?? Number.MAX_SAFE_INTEGER;
    if (orderA !== orderB) return orderA - orderB;
    return (a.title ?? '').localeCompare(b.title ?? '');
  });


const mapGuideDocs = (guides: GuideDoc[]): NavSection[] => {
  const sortedGuides = sortByOrder(guides);
  const grouped = new Map<string, NavItem[]>();
  sortedGuides.forEach((doc) => {
    const key = doc.section;
    const href = doc.url ?? `/${SECTION_MAP[key]}/${doc.slug}`;
    const entry: NavItem = {
      title: doc.title,
      href,
      description: doc.description,
      tags: doc.tags
    };
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key)!.push(entry);
  });

  return Array.from(grouped.entries()).map(([section, items]) => ({
    id: SECTION_MAP[section] ?? section.toLowerCase(),
    title: section,
    href: `/${SECTION_MAP[section] ?? section.toLowerCase()}`,
    items
  }));
};

const mapComponentDocs = (components: ComponentDoc[]): NavSection => {
  const sortedComponents = sortByOrder(components);
  const items: NavItem[] = [
    {
      title: 'All Components',
      href: '/components'
    },
    ...sortedComponents.map((component) => ({
      title: component.title,
      href: component.url ?? `/components/${component.slug}`,
      description: component.summary,
      status: component.status,
      tags: component.tags
    }))
  ];

  return {
    id: 'components',
    title: 'Components',
    href: '/components',
    items
  };
};

const buildNavigation = (): NavSection[] => {
  const components = mapComponentDocs(allComponentDocs);
  const others = mapGuideDocs(allGuideDocs);
  const aboutSection: NavSection = {
    id: 'about',
    title: 'About',
    href: '/about',
    items: []
  };
  const orderedSections: string[] = ['About', 'Foundations', 'Components', 'Patterns', 'Accessibility', 'Developers'];

  const sectionMap = new Map<string, NavSection>();
  others.forEach((section) => {
    if (section.title === 'Changelog') {
      return;
    }
    sectionMap.set(section.title, section);
  });
  sectionMap.set('Components', components);
  sectionMap.set('About', aboutSection);

  return orderedSections
    .map((key) => sectionMap.get(key))
    .filter((section): section is NavSection => Boolean(section));
};

let cachedNavigation: NavSection[] | null = null;

export const getNavigation = (): NavSection[] => {
  if (!cachedNavigation) {
    cachedNavigation = buildNavigation();
  }
  return cachedNavigation;
};

export const refreshNavigationCache = async (): Promise<void> => {
  cachedNavigation = buildNavigation();
};
