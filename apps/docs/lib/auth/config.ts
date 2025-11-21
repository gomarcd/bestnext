import type { AuthUser, Credentials } from './types';

const DEFAULT_USERNAME = 'admin';
const DEFAULT_PASSWORD = 'admin123';
const DEFAULT_DISPLAY_NAME = 'Administrator';

const username = process.env.ADMIN_USERNAME ?? DEFAULT_USERNAME;
const password = process.env.ADMIN_PASSWORD ?? DEFAULT_PASSWORD;
const displayName = process.env.ADMIN_DISPLAY_NAME ?? DEFAULT_DISPLAY_NAME;

if (username === DEFAULT_USERNAME || password === DEFAULT_PASSWORD) {
  console.warn(
    'Using default admin credentials. Set ADMIN_USERNAME and ADMIN_PASSWORD environment variables before deploying to production.'
  );
}

export const staticAuthConfig: { credentials: Credentials; user: AuthUser } = {
  credentials: { username, password },
  user: {
    id: 'static-admin',
    name: displayName,
    role: 'admin'
  }
};
