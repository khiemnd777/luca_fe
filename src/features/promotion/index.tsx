import React from "react";
import type { ModuleDescriptor } from "@root/core/module/types";
import { registerModule } from "@root/core/module/registry";
import DiscountIcon from '@mui/icons-material/Discount';

const UnderConstructionPage = React.lazy(() => import("@core/pages/under-construction-page"));

const mod: ModuleDescriptor = {
  id: "promotion",
  routes: [
    {
      key: "promotion",
      label: "Khuyến mãi",
      title: "Khuyến mãi",
      path: "/promotion",
      element: <UnderConstructionPage />,
      icon: <DiscountIcon />,
      priority: 96,
    },
  ],
};

registerModule(mod);
