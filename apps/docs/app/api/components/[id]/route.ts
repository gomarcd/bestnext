import { NextResponse } from 'next/server';

import { allComponentDocs } from 'contentlayer/generated';

function buildComponentResource(doc: (typeof allComponentDocs)[number]) {
  const baseUrl = doc.url ?? `/components/${doc.slug}`;
  return {
    id: doc.id,
    name: doc.title,
    status: doc.status,
    since: doc.since,
    deprecated: false,
    tags: doc.tags ?? [],
    figma_url: doc.figma ?? null,
    routes: {
      overview: baseUrl,
      ux: `${baseUrl}#overview`,
      developer: `${baseUrl}#developer`,
      a11y: `${baseUrl}#accessibility`
    },
    props: doc.props ?? [],
    events: doc.events ?? [],
    slots: doc.slots ?? [],
    tokens: doc.tokens ?? [],
    code: doc.code ?? {},
    dependencies: doc.dependencies ?? [],
    a11y: doc.a11y ?? {}
  };
}

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const doc = allComponentDocs.find((component) => component.id === params.id);
  if (!doc) {
    return NextResponse.json({ error: 'Component not found' }, { status: 404 });
  }

  return NextResponse.json(buildComponentResource(doc));
}
