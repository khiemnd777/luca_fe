import React from "react";
import type { ModuleDescriptor } from "@root/core/module/types";
import { registerModule } from "@root/core/module/registry";
import CategoryIcon from '@mui/icons-material/Category';

const MaterialPage = React.lazy(() => import("@features/material/presentation/pages/material-page"));

const mod: ModuleDescriptor = {
  id: "material",
  routes: [
    {
      path: "/material",
      element: <MaterialPage />,
    },
  ],
  menuItems: [
    {
      key: "material",
      label: "Nguyên liệu",
      to: "/material",
      icon: <CategoryIcon />,
      priority: 99,
    },
  ],
};

registerModule(mod);
