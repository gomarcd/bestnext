import { NextResponse } from 'next/server';

import { getCurrentUser } from '@/lib/auth/session';
import { refreshNavigationCache } from '@/lib/navigation';

export async function POST() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await refreshNavigationCache();

  return NextResponse.json({ status: 'ok' });
}
