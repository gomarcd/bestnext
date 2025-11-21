import { NextResponse } from 'next/server';

import { ensurePageByPath, getPageByPath, updatePageContent, updatePageSections } from '@/lib/cms/pages';
import type { PageSection } from '@/lib/cms/types';
import { getCurrentUser } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';
export const runtime = 'nodejs';

function normalizePath(path: string | null): string | null {
  if (!path) return null;
  if (path.length === 0) return '/';
  return path.startsWith('/') ? path : `/${path}`;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const path = normalizePath(searchParams.get('path'));

  if (!path) {
    return NextResponse.json({ error: 'Missing path parameter' }, { status: 400 });
  }

  const page = await ensurePageByPath(path);

  if (!page) {
    return NextResponse.json({ error: 'Page not found' }, { status: 404 });
  }

  return NextResponse.json({ page });
}

export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const path = normalizePath(searchParams.get('path'));

  if (!path) {
    return NextResponse.json({ error: 'Missing path parameter' }, { status: 400 });
  }

  const payload = (await request.json().catch(() => null)) as
    | { title?: string; body?: string; sections?: PageSection[] }
    | null;

  const page = await getPageByPath(path);

  if (!page) {
    return NextResponse.json({ error: 'Page not found' }, { status: 404 });
  }

  let updated: Awaited<ReturnType<typeof updatePageSections>>;

  if (payload?.sections) {
    updated = await updatePageSections({
      pageId: page.id,
      sections: payload.sections,
      authorId: user.id,
      title: payload.title
    });
  } else if (payload?.body !== undefined) {
    updated = await updatePageContent({
      pageId: page.id,
      body: payload.body,
      authorId: user.id
    });
  } else if (payload?.title !== undefined) {
    updated = await updatePageSections({
      pageId: page.id,
      sections: page.sections,
      title: payload.title,
      authorId: user.id
    });
  } else {
    return NextResponse.json({ error: 'No changes provided' }, { status: 400 });
  }

  return NextResponse.json({ page: updated });
}
