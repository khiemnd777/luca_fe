import type { ModuleDescriptor } from "@core/module/types";
import { registerModule } from "@core/module/registry";
import InventoryIcon from '@mui/icons-material/Inventory';
import OneColumnPage from "@root/core/pages/one-column-page";
import DeveloperBoardIcon from '@mui/icons-material/DeveloperBoard';

const mod: ModuleDescriptor = {
  id: "product",
  routes: [
    {
      key: "product",
      permissions: ["product.view"],
      element: <OneColumnPage />,
      label: "Sản phẩm",
      title: "Sản phẩm",
      path: "/product",
      icon: <InventoryIcon />,
      priority: 98,
      children: [{
        key: "process",
        permissions: ["process.view"],
        element: <OneColumnPage />,
        label: "Công đoạn",
        title: "Công đoạn",
        path: "/process",
        icon: <DeveloperBoardIcon />,
        priority: 1,
      }],
    },
  ],
};

registerModule(mod);
