export type AuthRole = 'admin';

export interface AuthUser {
  id: string;
  name: string;
  role: AuthRole;
}

export interface Credentials {
  username: string;
  password: string;
}
