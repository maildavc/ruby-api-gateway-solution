export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: "developer" | "admin" | "owner";
  lastLoginAt?: string;
};

export type AuthSession = {
  user: AuthUser;
  token: string;
};
