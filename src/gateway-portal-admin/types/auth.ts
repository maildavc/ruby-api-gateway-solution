export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "owner" | "auditor";
  permissions: string[];
  lastLoginAt?: string;
};

export type AuthSession = {
  user: AuthUser;
  token: string;
};
