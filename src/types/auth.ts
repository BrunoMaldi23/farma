export type AuthUser = {
  id: string;
  rut: string;
  firstName: string;
  lastName: string;
  email: string | null;
  username: string;
  role: string;
  permissions: string[];
};

export type LoginResponse = {
  ok: boolean;
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
};
