import type { ModuleDescriptor } from "@core/module/types";
import { registerModule } from "@core/module/registry";
import ClassIcon from '@mui/icons-material/Class';
import OneColumnPage from "@root/core/pages/one-column-page";

const mod: ModuleDescriptor = {
  id: "category",
  routes: [
    {
      key: "category",
      permissions: ["product.view"],
      element: <OneColumnPage />,
      label: "Danh mục",
      title: "Danh mục",
      path: "/category",
      icon: <ClassIcon />,
      priority: 99,
      children: [
        {
          hidden: true,
          key: "category-detail",
          permissions: ["product.view"],
          element: <OneColumnPage />,
          label: "Chi tiết danh mục",
          title: "Chi tiết danh mục",
          path: "/category/:id",
          priority: 99,
        }
      ]
    },
  ],
};

registerModule(mod);
