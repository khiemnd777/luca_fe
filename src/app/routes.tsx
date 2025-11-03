// src/app/routes.tsx
import * as React from "react";
import { useMemo } from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { listRoutes } from "@core/module/registry";
import RequireAuth from "@core/auth/require-auth";

// core pages (lazy)
const LoginPage = React.lazy(() => import("@core/pages/login-page"));
const ForbiddenPage = React.lazy(() => import("@core/pages/forbidden-page"));
const NotFoundPage = React.lazy(() => import("@core/pages/not-found-page"));

function withSuspense(node: React.ReactNode) {
  return <React.Suspense fallback={null}>{node}</React.Suspense>;
}

function useAppRouter() {
  const router = useMemo(() => {
    // 0) Default "/" → login (nếu chưa login) hoặc module đầu tiên (nếu đã login)
    // const rootDefault = [{ path: "/", element: <DefaultEntry /> }];

    // 1) Public routes
    const publicRoutes = [
      { path: "/login", element: withSuspense(<LoginPage />) },
      { path: "/forbidden", element: withSuspense(<ForbiddenPage />) },
    ];

    // 2) Module routes (children của RequireAuth)
    const authedChildren = listRoutes().map((r) => {
      const el =
        typeof r.element === "function"
          ? React.createElement(r.element as any)
          : r.element;
      return { path: r.path, element: withSuspense(el) };
    });

    // 3) Group bảo vệ bằng RequireAuth (dùng Outlet bên trong)
    const protectedGroup = {
      element: <RequireAuth />,
      children: authedChildren,
    };

    // 4) 404
    const notFound = [{ path: "*", element: withSuspense(<NotFoundPage />) }];

    return createBrowserRouter([...publicRoutes, protectedGroup, ...notFound]);
  }, []);

  return router;
}

export function AppRouter() {
  const router = useAppRouter();
  return <RouterProvider router={router} />;
}
