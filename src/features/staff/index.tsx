import React from "react";
import type { ModuleDescriptor } from "@root/core/module/types";
import { registerModule } from "@root/core/module/registry";
import BadgeIcon from '@mui/icons-material/Badge';

const StaffPage = React.lazy(() => import("@features/staff/presentation/pages/staff-page"));
const SectionPage = React.lazy(() => import("@features/staff/presentation/pages/section-page"));
const TechnicianPage = React.lazy(() => import("@features/staff/presentation/pages/technician-page"));

const mod: ModuleDescriptor = {
  id: "staff",
  routes: [
    {
      path: "/staff",
      element: <StaffPage />,
    },
    {
      path: "/section",
      element: <SectionPage />,
    },
    {
      path: "/technician",
      element: <TechnicianPage />,
    },
  ],
  menuItems: [
    {
      key: "staff",
      label: "Nhân sự",
      to: "/staff",
      icon: <BadgeIcon />,
      priority: 94,
      subItems: [
        {
          key: "section",
          label: "Bộ phận",
          to: "/section",
          priority: 2,
        },
        {
          key: "technician",
          label: "Kỹ thuật viên",
          to: "/technician",
          priority: 1,
        },
      ],
    },
  ],
};

registerModule(mod);
