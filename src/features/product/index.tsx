import React from "react";
import type { ModuleDescriptor } from "@root/core/module/types";
import { registerModule } from "@root/core/module/registry";
import InventoryIcon from '@mui/icons-material/Inventory';

const ProductPage = React.lazy(() => import("@features/product/presentation/pages/product-page"));

const mod: ModuleDescriptor = {
  id: "product",
  routes: [
    {
      path: "/product",
      element: <ProductPage />,
    },
  ],
  menuItems: [
    {
      key: "product",
      label: "Sản phẩm",
      to: "/product",
      icon: <InventoryIcon />,
      priority: 98,
    },
  ],
};

registerModule(mod);
