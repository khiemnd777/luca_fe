import React from "react";
import type { ModuleDescriptor } from "@root/core/module/types";
import { registerModule } from "@root/core/module/registry";
import DiscountIcon from '@mui/icons-material/Discount';

const PromotionPage = React.lazy(() => import("@features/promotion/presentation/pages/promotion-page"));

const mod: ModuleDescriptor = {
  id: "promotion",
  routes: [
    {
      path: "/promotion",
      element: <PromotionPage />,
    },
  ],
  menuItems: [
    {
      key: "promotion",
      label: "Khuyến mãi",
      to: "/promotion",
      icon: <DiscountIcon />,
      priority: 96,
    },
  ],
};

registerModule(mod);
