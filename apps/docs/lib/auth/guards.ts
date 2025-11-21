import { redirect } from 'next/navigation';

import { getCurrentUser } from './session';

export async function requireAdmin(nextPath: string = '/admin'): Promise<NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>> {
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  }
  return user;
}
