import { NextResponse } from 'next/server';

import { searchDocs } from '@/lib/search';

export const runtime = 'edge';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q') ?? '';
  const limit = Number.parseInt(searchParams.get('limit') ?? '8', 10);
  const results = searchDocs(query, Number.isNaN(limit) ? 8 : limit);

  return NextResponse.json({ query, results });
}
