import { useAuth } from "@core/auth/use-auth";
import React from "react";

export function useRoleChecks() {
  const { hasRole, isLoggedIn } = useAuth();
  const hasAnyRole = (roles: string[]) => roles.some((r) => hasRole(r));
  const hasAllRoles = (roles: string[]) => roles.every((r) => hasRole(r));
  return { isLoggedIn, hasRole, hasAnyRole, hasAllRoles };
}

export type Perm = string;

export function usePermissionChecks() {
  const { hasPermission, isLoggedIn } = useAuth();

  const hasAnyPermissions = React.useCallback(
    (perms: Perm[]) => perms.some((p) => hasPermission?.(p)),
    [hasPermission]
  );

  const hasAllPermissions = React.useCallback(
    (perms: Perm[]) => perms.every((p) => hasPermission?.(p)),
    [hasPermission]
  );

  return { isLoggedIn, hasPermission, hasAnyPermissions, hasAllPermissions };
}