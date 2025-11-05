import * as React from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { type Perm, useRoleChecks, usePermissionChecks } from "@core/auth/rbac-utils";
import { getRefreshToken } from "@core/network/token-utils";
import { hasUsableAccessToken, isAuthRefreshing, didLastRefreshFail } from "@core/network/api-client";
import { Box, LinearProgress } from "@mui/material";

/**
 * Anti-flicker strategy:
 * - Không bao giờ return null khi đang refresh → giữ UI hiện tại.
 * - Chỉ redirect khi (không có RT) hoặc (refresh đã fail/timeout).
 * - Hiển thị thanh tiến trình mảnh ở top để báo trạng thái (nhưng không unmount trang).
 */
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

  const usable = hasUsableAccessToken();
  const hasRT = !!getRefreshToken();
  const refreshing = isAuthRefreshing();
  const refreshFailed = didLastRefreshFail();

  const redirectingRef = React.useRef(false);

  // Điều kiện phải login nhưng không có AT usable
  const mustLogin = requireLogin && !usable;

  // Trường hợp cần login:
  // - Nếu có RT và CHƯA fail refresh: GIỮ UI (không return null, không redirect).
  // - Nếu KHÔNG có RT hoặc đã fail refresh: redirect về login.
  const shouldRedirectToLogin =
    mustLogin &&
    (!hasRT || refreshFailed) &&
    !redirectingRef.current;

  React.useEffect(() => {
    if (!shouldRedirectToLogin) return;
    redirectingRef.current = true;

    const params = new URLSearchParams(window.location.search);
    const loc = window.location;
    const raw = params.get("redirect") ?? (loc.pathname + loc.search);
    const safeRedirect = raw.startsWith(loginPath) ? "/" : raw;
    navigate(`${loginPath}?redirect=${encodeURIComponent(safeRedirect)}`, { replace: true });
  }, [shouldRedirectToLogin, navigate, loginPath]);

  // Không render gì thêm khi đã bắt đầu điều hướng
  // (vẫn KHÔNG unmount nội dung trước khi navigate chạy xong frame hiện tại)
  // => tránh "nháy" ở 1 frame.
  // Không return null ở các case chờ refresh nữa.

  // Role/permission checks: nếu không đạt → điều hướng forbidden nhưng vẫn giữ khung trang hiện tại tới khi navigate.
  if (roles?.length) {
    const ok = requireAll ? hasAllRoles(roles) : hasAnyRole(roles);
    if (!ok && !redirectingRef.current) {
      redirectingRef.current = true;
      navigate(forbiddenPath, { replace: true });
    }
  }
  if (permissions?.length) {
    const ok = hasAnyPermissions(permissions);
    if (!ok && !redirectingRef.current) {
      redirectingRef.current = true;
      navigate(forbiddenPath, { replace: true });
    }
  }

  return (
    <Box sx={{ position: "relative", minHeight: 0 }}>
      {/* Thanh tiến trình rất mảnh ở top: báo đang refresh, không làm nhấp nháy layout */}
      {mustLogin && hasRT && !refreshFailed && (refreshing) && (
        <Box sx={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 13000 }}>
          <LinearProgress />
        </Box>
      )}
      <Outlet />
    </Box>
  );
}
