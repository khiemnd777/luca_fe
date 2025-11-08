import React from "react";
import type { ModuleDescriptor } from "@root/core/module/types";
import { registerModule } from "@root/core/module/registry";
import ChecklistIcon from '@mui/icons-material/Checklist';

const UnderConstructionPage = React.lazy(() => import("@core/pages/under-construction-page"));

const mod: ModuleDescriptor = {
  id: "order",
  routes: [
    {
      key: "order",
      label: "Đơn hàng",
      title: "Đơn hàng",
      path: "/order",
      element: <UnderConstructionPage />,
      icon: <ChecklistIcon />,
      priority: 97,
    },
  ],
};

registerModule(mod);
