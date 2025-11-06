import React from "react";
import type { ModuleDescriptor } from "@root/core/module/types";
import { registerModule } from "@root/core/module/registry";
import KeyIcon from '@mui/icons-material/Key';

const RBACPage = React.lazy(() => import("@features/rbac/presentation/pages/rbac-page"));
const RolePage = React.lazy(() => import("@features/rbac/presentation/pages/role-page"));
const PermissionPage = React.lazy(() => import("@features/rbac/presentation/pages/permission-page"));

const mod: ModuleDescriptor = {
  id: "rbac",
  routes: [
    {
      path: "/rbac",
      element: <RBACPage />,
    },
    {
      path: "/role",
      element: <RolePage />,
    },
    {
      path: "/permission",
      element: <PermissionPage />,
    }
  ],
  menuItems: [
    {
      key: "rbac",
      permissions: ["rbac.manage"],
      label: "Quyền hạn",
      to: "/rbac",
      icon: <KeyIcon />,
      priority: 1,
      // subItems: [
      //   {
      //     key: "role",
      //     label: "Vai trò",
      //     to: "/role",
      //     priority: 2,
      //   },
      //   {
      //     key: "permission",
      //     label: "Phân quyền",
      //     to: "/permission",
      //     priority: 1,
      //   },
      // ],
    },
  ],
};

registerModule(mod);
