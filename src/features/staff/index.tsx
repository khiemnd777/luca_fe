import React from "react";
import type { ModuleDescriptor } from "@root/core/module/types";
import { registerModule } from "@root/core/module/registry";
import BadgeIcon from '@mui/icons-material/Badge';

const StaffPage = React.lazy(() => import("@features/staff/presentation/pages/staff-page"));

const mod: ModuleDescriptor = {
  id: "staff",
  routes: [
    {
      path: "/staff",
      element: <StaffPage />,
    },
  ],
  menuItems: [
    {
      key: "staff",
      label: "Nhân viên",
      to: "/staff",
      icon: <BadgeIcon />,
      priority: 94,
    },
  ],
};

registerModule(mod);
