'use server';

import { redirect } from 'next/navigation';

import { authenticate } from '@/lib/auth/provider';
import { createSession, destroySession } from '@/lib/auth/session';

export interface LoginFormState {
  error?: string;
}

export async function loginAction(
  _prevState: LoginFormState | undefined,
  formData: FormData
): Promise<LoginFormState | void> {
  const username = (formData.get('username') ?? '').toString();
  const password = (formData.get('password') ?? '').toString();
  const redirectTo = (formData.get('redirectTo') ?? '').toString();

  const user = await authenticate(username, password);

  if (!user) {
    return { error: 'Invalid username or password' };
  }

  await createSession(user);

  const safeRedirect = redirectTo && redirectTo.startsWith('/') && !redirectTo.startsWith('//');

  redirect(safeRedirect ? redirectTo : '/admin');
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect('/');
}
