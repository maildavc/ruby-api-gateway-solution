import { AuthUser } from "@/types/auth";

export function canAccessPortal(user: AuthUser | null) {
  return Boolean(user && (user.role === "admin" || user.role === "owner" || user.role === "auditor"));
}

export function hasPermission(user: AuthUser | null, permission: string) {
  if (!user) return false;
  if (user.role === "owner") return true;
  return user.permissions?.includes(permission);
}

export function hasAnyPermission(user: AuthUser | null, permissions: string[]) {
  if (!user) return false;
  if (user.role === "owner") return true;
  return permissions.some((permission) => user.permissions?.includes(permission));
}
