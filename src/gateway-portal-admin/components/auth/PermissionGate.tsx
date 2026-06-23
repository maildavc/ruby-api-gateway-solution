"use client";

import { ReactNode } from "react";

import { useAuth } from "@/lib/auth/useAuth";
import { hasAnyPermission, hasPermission } from "@/lib/auth/routeGuards";

export function PermissionGate({
  permission,
  anyOf,
  children,
  fallback = null,
}: {
  permission?: string;
  anyOf?: string[];
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const { user } = useAuth();

  const allowed = permission
    ? hasPermission(user, permission)
    : anyOf
      ? hasAnyPermission(user, anyOf)
      : true;

  if (!allowed) return <>{fallback}</>;

  return <>{children}</>;
}
