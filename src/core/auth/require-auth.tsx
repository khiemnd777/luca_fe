import * as React from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { type Perm, useRoleChecks, usePermissionChecks } from "@core/auth/rbac-utils";
import { getRefreshToken } from "@core/network/token-utils";
import { hasUsableAccessToken, isAuthRefreshing, didLastRefreshFail } from "@core/network/api-client";
import { Box, LinearProgress } from "@mui/material";

type RequireAuthProps = {
  roles?: string[];
  permissions?: Perm[];
  requireAll?: boolean;
  loginPath?: string;
  forbiddenPath?: string;
  requireLogin?: boolean; // default true
};

export default function RequireAuth({
  roles,
  permissions,
  requireAll = false,
  loginPath = "/login",
  forbiddenPath = "/forbidden",
  requireLogin = true,
}: RequireAuthProps) {
  const { hasAnyRole, hasAllRoles } = useRoleChecks();
  const { hasAnyPermissions } = usePermissionChecks();

  const navigate = useNavigate();
  const location = useLocation();

  // Auth state
  const usable = hasUsableAccessToken();
  const hasRT = !!getRefreshToken();
  const refreshing = isAuthRefreshing();
  const refreshFailed = didLastRefreshFail();

  const mustLogin = requireLogin && !usable;

  const redirectTo = React.useMemo(() => {
    if (mustLogin && (!hasRT || refreshFailed)) {
      const params = new URLSearchParams(window.location.search);
      const loc = window.location;
      const raw = params.get("redirect") ?? (loc.pathname + loc.search);
      const safeRedirect = raw.startsWith(loginPath) ? "/" : raw;
      return `${loginPath}?redirect=${encodeURIComponent(safeRedirect)}`;
    }


    if (refreshing) return null;
    if (roles?.length) {
      const ok = requireAll ? hasAllRoles(roles) : hasAnyRole(roles);
      if (!ok) return forbiddenPath;
    }
    if (permissions?.length) {
      const ok = hasAnyPermissions(permissions);
      if (!ok) return forbiddenPath;
    }
    return null;
  }, [
    mustLogin,
    hasRT,
    refreshFailed,
    refreshing,
    roles,
    permissions,
    requireAll,
    hasAllRoles,
    hasAnyRole,
    hasAnyPermissions,
    loginPath,
    forbiddenPath,
  ]);

  React.useEffect(() => {
    if (!redirectTo) return;
    if (location.pathname + location.search === redirectTo) return;
    if (redirectTo === forbiddenPath && location.pathname === forbiddenPath) return;
    navigate(redirectTo, { replace: true });
  }, [redirectTo, navigate, location.pathname, location.search, forbiddenPath]);

  const blocking = !!redirectTo;

  return (
    <Box sx={{ position: "relative", minHeight: 0 }}>
      {(blocking || (mustLogin && hasRT && !refreshFailed && refreshing)) && (
        <Box sx={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 13000 }}>
          <LinearProgress />
        </Box>
      )}
      {!blocking && <Outlet />}
    </Box>
  );
}