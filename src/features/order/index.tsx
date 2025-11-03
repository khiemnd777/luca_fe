import React from "react";
import type { ModuleDescriptor } from "@root/core/module/types";
import { registerModule } from "@root/core/module/registry";
import ChecklistIcon from '@mui/icons-material/Checklist';

const OrderPage = React.lazy(() => import("@features/order/presentation/pages/order-page"));

const mod: ModuleDescriptor = {
  id: "order",
  routes: [
    {
      path: "/order",
      element: <OrderPage />,
    },
  ],
  menuItems: [
    {
      key: "order",
      label: "Đơn hàng",
      to: "/order",
      icon: <ChecklistIcon />,
      priority: 97,
    },
  ],
};

registerModule(mod);
