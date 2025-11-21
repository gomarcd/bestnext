import { NextResponse } from 'next/server';

import { allComponentDocs } from 'contentlayer/generated';

export async function GET() {
  const components = allComponentDocs.map((component) => ({
    id: component.componentName ?? component.slug,
    title: component.title,
    description: component.summary ?? component.description ?? '',
    status: component.status,
    tags: component.tags ?? []
  }));

  return NextResponse.json({ components });
}
