import type { ModuleDescriptor } from "@core/module/types";
import { registerModule } from "@core/module/registry";
import ChecklistIcon from '@mui/icons-material/Checklist';
import OneColumnPage from "@root/core/pages/one-column-page";

const mod: ModuleDescriptor = {
  id: "order",
  routes: [
    {
      key: "order",
      permissions: ["order.view"],
      element: <OneColumnPage />,
      label: "Đơn hàng",
      title: "Đơn hàng",
      path: "/order",
      icon: <ChecklistIcon />,
      priority: 97,
    },
  ],
};

registerModule(mod);
