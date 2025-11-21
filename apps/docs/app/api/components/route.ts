import { NextResponse } from 'next/server';

import { allComponentDocs } from 'contentlayer/generated';

const DEFAULT_PAGE_SIZE = 20;

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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const tag = searchParams.get('tag');
  const query = searchParams.get('q');
  const pageParam = Number.parseInt(searchParams.get('page') ?? '1', 10);
  const pageSizeParam = Number.parseInt(searchParams.get('pageSize') ?? `${DEFAULT_PAGE_SIZE}`, 10);

  const page = Number.isNaN(pageParam) || pageParam < 1 ? 1 : pageParam;
  const pageSize = Number.isNaN(pageSizeParam) || pageSizeParam < 1 ? DEFAULT_PAGE_SIZE : pageSizeParam;

  let docs = [...allComponentDocs];

  if (status) {
    docs = docs.filter((doc) => doc.status === status);
  }

  if (tag) {
    docs = docs.filter((doc) => doc.tags?.includes(tag));
  }

  if (query) {
    const q = query.toLowerCase();
    docs = docs.filter((doc) =>
      [doc.title, doc.summary, doc.tags?.join(' ')]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(q)
    );
  }

  const total = docs.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = (page - 1) * pageSize;
  const data = docs.slice(start, start + pageSize).map(buildComponentResource);

  return NextResponse.json({
    meta: {
      total,
      page,
      pageSize,
      totalPages
    },
    data
  });
}
