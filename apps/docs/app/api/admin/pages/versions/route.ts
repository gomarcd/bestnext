import { NextResponse } from 'next/server';

import { getCurrentUser } from '@/lib/auth/session';
import { getPageByPath, getPageRevisions, restorePageRevision } from '@/lib/cms/pages';

function normalizePath(path: string | null): string | null {
  if (!path) return null;
  if (path.length === 0) return '/';
  return path.startsWith('/') ? path : `/${path}`;
}

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const path = normalizePath(searchParams.get('path'));

  if (!path) {
    return NextResponse.json({ error: 'Missing path parameter' }, { status: 400 });
  }

  const page = await getPageByPath(path);

  if (!page) {
    return NextResponse.json({ error: 'Page not found' }, { status: 404 });
  }

  const revisions = await getPageRevisions(page.id);

  return NextResponse.json({
    revisions: revisions.map((revision) => ({
      id: revision.id,
      version: revision.version,
      createdAt: revision.createdAt,
      authorId: revision.authorId,
      status: revision.status
    }))
  });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as { path?: string; revisionId?: string } | null;

  if (!body?.path || !body?.revisionId) {
    return NextResponse.json({ error: 'path and revisionId are required' }, { status: 400 });
  }

  const path = normalizePath(body.path);

  if (!path) {
    return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
  }

  const page = await getPageByPath(path);

  if (!page) {
    return NextResponse.json({ error: 'Page not found' }, { status: 404 });
  }

  const restored = await restorePageRevision({
    pageId: page.id,
    revisionId: body.revisionId,
    authorId: user.id
  });

  if (!restored) {
    return NextResponse.json({ error: 'Revision not found' }, { status: 404 });
  }

  return NextResponse.json({ page: restored });
}
