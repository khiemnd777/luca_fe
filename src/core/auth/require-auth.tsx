import { Navigate, Outlet, useLocation, useSearchParams } from "react-router-dom";
import { type Perm, useRoleChecks, usePermissionChecks } from "@core/auth/rbac-utils";

/* Ví dụ sử dụng <RequireAuth />:
export const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  { path: "/forbidden", element: <ForbiddenPage /> },

  {
    element: <RequireAuth />, // chỉ cần login
    children: [
      { path: "/", element: <DashboardPage /> },

      // chỉ yêu cầu role
      {
        element: <RequireAuth roles={["admin", "editor"]} />,
        children: [{ path: "/editor", element: <EditorPage /> }],
      },

      // chỉ yêu cầu quyền (dựa vào matrix permission)
      {
        element: <RequireAuth permissions={["post.create", "post.manage"]} />,
        children: [{ path: "/posts/new", element: <NewPostPage /> }],
      },

      // vừa yêu cầu role, vừa yêu cầu permission
      {
        element: <RequireAuth roles={["admin"]} permissions={["system.manage"]} />,
        children: [{ path: "/admin", element: <AdminPage /> }],
      },
    ],
  },
]);
*/

type RequireAuthProps = {
  roles?: string[];
  permissions?: Perm[];
  requireAll?: boolean; // chỉ áp dụng cho roles
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
  const { isLoggedIn, hasAnyRole, hasAllRoles } = useRoleChecks();
  const { hasAnyPermissions } = usePermissionChecks();

  const loc = useLocation();
  const [params] = useSearchParams();

  // 1️⃣ Chưa đăng nhập → redirect login
  if (requireLogin && !isLoggedIn) {
    const redirect = params.get("redirect") ?? loc.pathname + loc.search;
    return (
      <Navigate
        replace
        to={`${loginPath}?redirect=${encodeURIComponent(redirect)}`}
      />
    );
  }

  // 2️⃣ Kiểm tra roles (nếu có)
  if (roles?.length) {
    const ok = requireAll ? hasAllRoles(roles) : hasAnyRole(roles);
    if (!ok) return <Navigate replace to={forbiddenPath} />;
  }

  // 3️⃣ Kiểm tra permissions (nếu có)
  if (permissions?.length) {
    const ok = hasAnyPermissions(permissions);
    if (!ok) return <Navigate replace to={forbiddenPath} />;
  }

  // ✅ Nếu mọi thứ hợp lệ → render route con
  return <Outlet />;
}
