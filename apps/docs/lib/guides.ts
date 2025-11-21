import { allGuideDocs, type GuideDoc } from 'contentlayer/generated';

const sortGuides = (docs: GuideDoc[]) =>
  [...docs].sort((a, b) => {
    const orderA = a.order ?? Number.MAX_SAFE_INTEGER;
    const orderB = b.order ?? Number.MAX_SAFE_INTEGER;
    if (orderA !== orderB) return orderA - orderB;
    return a.title.localeCompare(b.title);
  });

export function getGuidesBySection(section: GuideDoc['section']) {
  return sortGuides(allGuideDocs.filter((doc) => doc.section === section));
}

export function getGuideBySlug(slug: string) {
  return allGuideDocs.find((doc) => doc.slug === slug);
}
