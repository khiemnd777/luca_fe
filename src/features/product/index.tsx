import React from "react";
import type { ModuleDescriptor } from "@root/core/module/types";
import { registerModule } from "@root/core/module/registry";
import InventoryIcon from '@mui/icons-material/Inventory';

const UnderConstructionPage = React.lazy(() => import("@core/pages/under-construction-page"));

const mod: ModuleDescriptor = {
  id: "product",
  routes: [
    {
      key: "product",
      label: "Sản phẩm",
      title: "Sản phẩm",
      path: "/product",
      element: <UnderConstructionPage />,
      icon: <InventoryIcon />,
      priority: 98,
    },
  ],
};

registerModule(mod);
