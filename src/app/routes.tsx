import * as React from "react";
import { useMemo } from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { listRoutes } from "@core/module/registry";
import RequireAuth from "@core/auth/require-auth";

const LoginPage = React.lazy(() => import("@core/pages/login-page"));
const ForbiddenPage = React.lazy(() => import("@core/pages/forbidden-page"));
const NotFoundPage = React.lazy(() => import("@core/pages/not-found-page"));

function withSuspense(node: React.ReactNode) {
  return <React.Suspense fallback={null}>{node}</React.Suspense>;
}

function useAppRouter() {
  const router = useMemo(() => {
    const publicRoutes = [
      { path: "/login", element: withSuspense(<LoginPage />) },
      { path: "/forbidden", element: withSuspense(<ForbiddenPage />) },
    ];

    const protectedGroups = listRoutes().map((r) => {
      const el =
        typeof r.element === "function"
          ? React.createElement(r.element as any)
          : r.element;

      return {
        element: (
          <RequireAuth
            permissions={r.permissions}
          />
        ),
        children: [
          {
            path: r.path,
            element: withSuspense(el),
          },
        ],
      };
    });

    const notFound = [{ path: "*", element: withSuspense(<NotFoundPage />) }];

    return createBrowserRouter([...publicRoutes, ...protectedGroups, ...notFound]);
  }, []);

  return router;
}

export function AppRouter() {
  const router = useAppRouter();
  return <RouterProvider router={router} />;
}
