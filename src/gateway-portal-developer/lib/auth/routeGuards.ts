import { AuthUser } from "@/types/auth";

export function canAccessPortal(user: AuthUser | null) {
  return Boolean(user);
}
