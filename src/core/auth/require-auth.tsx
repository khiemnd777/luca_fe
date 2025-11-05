import * as React from "react";
import { Outlet, useLocation, useSearchParams, useNavigate } from "react-router-dom";
import { type Perm, useRoleChecks, usePermissionChecks } from "@core/auth/rbac-utils";
import { getRefreshToken } from "@core/network/token-utils";
import { hasUsableAccessToken, isAuthRefreshing } from "@core/network/api-client";

function AuthHolding() {
  return (
    <div style={{
      display: "grid",
      placeItems: "center",
      minHeight: "60vh",
      fontSize: 14,
      opacity: 0.8
    }}>
      <div>Đang kiểm tra phiên đăng nhập…</div>
    </div>
  );
}

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
  const loc = useLocation();
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const usable = hasUsableAccessToken();
  const hasRT = !!getRefreshToken();
  const refreshing = isAuthRefreshing();

  // ===== 1) Redirect to /login (imperative) nếu không còn hy vọng đăng nhập =====
  const redirectingRef = React.useRef(false);
  const shouldRedirectToLogin = requireLogin && !usable && !hasRT && !refreshing;

  React.useEffect(() => {
    if (!shouldRedirectToLogin) return;
    if (redirectingRef.current) return; // chặn gọi lặp
    redirectingRef.current = true;

    const redirect = params.get("redirect") ?? (loc.pathname + loc.search);
    navigate(`${loginPath}?redirect=${encodeURIComponent(redirect)}`, { replace: true });
    // không setState gì thêm; trả về null trong render để kết thúc vòng đời an toàn
  }, [shouldRedirectToLogin, params, loc.pathname, loc.search, navigate, loginPath]);

  // Nếu đang chờ refresh (có RT hoặc đang refresh) hoặc vừa điều hướng → render trống để tránh bounce
  if (requireLogin && !usable) {
    // ✅ Còn cơ hội (có RT hoặc đang refresh) → đừng điều hướng, đừng trả null → hiển thị holding rõ ràng
    if (hasRT || refreshing || redirectingRef.current) {
      return <AuthHolding />;
    }

    // ❌ Hết cơ hội (không có RT, không refresh) → điều hướng /login (imperative) và hiển thị thông báo tạm
    if (!redirectingRef.current) {
      redirectingRef.current = true;

      const rawRedirect = params.get("redirect") ?? (loc.pathname + loc.search);
      // Tránh redirect=/login (vòng lặp)
      const redirect = rawRedirect.startsWith(loginPath) ? "/" : rawRedirect;

      // Hiển thị dòng thông báo ngay trước khi chuyển trang (tránh trắng)
      // (không bắt buộc, nhưng giúp UX mượt)
      setTimeout(() => {
        navigate(`${loginPath}?redirect=${encodeURIComponent(redirect)}`, { replace: true });
      }, 0);
    }

    return (
      <div style={{ display: "grid", placeItems: "center", minHeight: "60vh", fontSize: 14 }}>
        Phiên đăng nhập đã hết hạn, đang chuyển đến trang đăng nhập…
      </div>
    );
  }

  // ===== 2) Roles/Permissions =====
  if (roles?.length) {
    const ok = requireAll ? hasAllRoles(roles) : hasAnyRole(roles);
    if (!ok) {
      // Điều hướng imperatively để tránh <Navigate/>
      if (!redirectingRef.current) {
        redirectingRef.current = true;
        navigate(forbiddenPath, { replace: true });
      }
      return null;
    }
  }

  if (permissions?.length) {
    const ok = hasAnyPermissions(permissions);
    if (!ok) {
      if (!redirectingRef.current) {
        redirectingRef.current = true;
        navigate(forbiddenPath, { replace: true });
      }
      return null;
    }
  }

  // ===== 3) OK =====
  return <Outlet />;
}
