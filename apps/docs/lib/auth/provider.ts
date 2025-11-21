import { staticAuthConfig } from './config';
import type { AuthUser } from './types';

export async function authenticate(username: string, password: string): Promise<AuthUser | null> {
  const { credentials, user } = staticAuthConfig;

  if (username === credentials.username && password === credentials.password) {
    return user;
  }

  return null;
}
