import type { ModuleDescriptor } from "@core/module/types";
import { registerModule } from "@core/module/registry";
import MapsHomeWorkIcon from "@mui/icons-material/MapsHomeWork";
import OneColumnPage from "@root/core/pages/one-column-page";

const mod: ModuleDescriptor = {
  id: "deparment",
  routes: [
    {
      key: "deparment",
      permissions: ["department.view"],
      label: "Chi nhánh",
      title: "Chi nhánh",
      subtitle: "Quản lý thông tin chi nhánh và quan hệ chi nhánh cha - con.",
      path: "/deparment",
      icon: <MapsHomeWorkIcon />,
      element: <OneColumnPage />,
      priority: 96,
      children: [
        {
          hidden: true,
          key: "deparment-detail",
          permissions: ["department.view"],
          label: "Chi nhánh",
          title: "Chi nhánh",
          path: "/deparment/:deparmentId",
          element: <OneColumnPage />,
          priority: 97,
        },
      ],
    },
  ],
};

registerModule(mod);
