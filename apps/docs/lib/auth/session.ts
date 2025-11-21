import { cookies } from 'next/headers';
import { createHmac, randomBytes } from 'node:crypto';

import type { AuthUser } from './types';

const SESSION_COOKIE_NAME = 'ds_admin_session';
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 8; // 8 hours

function getSecret(): string {
  return process.env.ADMIN_SESSION_SECRET ?? 'dev-admin-session-secret';
}

function sign(payload: string): string {
  return createHmac('sha256', getSecret()).update(payload).digest('hex');
}

function encode(payload: Record<string, unknown>): string {
  const json = JSON.stringify(payload);
  const body = Buffer.from(json).toString('base64url');
  const signature = sign(body);
  return `${body}.${signature}`;
}

function decode(token: string): Record<string, unknown> | null {
  const [body, signature] = token.split('.');

  if (!body || !signature) {
    return null;
  }

  const expectedSignature = sign(body);
  if (expectedSignature !== signature) {
    return null;
  }

  try {
    const json = Buffer.from(body, 'base64url').toString('utf8');
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export async function createSession(user: AuthUser): Promise<void> {
  const issuedAt = Date.now();
  const expiresAt = issuedAt + SESSION_MAX_AGE_SECONDS * 1000;

  const payload = {
    id: randomBytes(16).toString('hex'),
    user,
    exp: expiresAt
  };

  const token = encode(payload);
  const cookieStore = cookies();

  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE_SECONDS
  });
}

export async function destroySession(): Promise<void> {
  cookies().delete(SESSION_COOKIE_NAME);
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const cookieStore = cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  const payload = decode(token);
  if (!payload) {
    return null;
  }

  const { user, exp } = payload as { user?: AuthUser; exp?: number };

  if (!user || !exp) {
    return null;
  }

  if (Date.now() > exp) {
    await destroySession();
    return null;
  }

  return user;
}

export async function isAuthenticated(): Promise<boolean> {
  return (await getCurrentUser()) !== null;
}
