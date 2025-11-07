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
      key: "staff",
      label: "Nhân sự",
      title: "Nhân sự",
      subtitle: "Quản lý nhân sự",
      path: "/staff",
      element: <StaffPage />,
      icon: <BadgeIcon />,
      priority: 94,
      children: [
        {
          key: "section",
          label: "Bộ phận",
          title: "Bộ phận",
          path: "/section",
          element: <SectionPage />,
          priority: 2,
        },
        {
          key: "technician",
          label: "Kỹ thuật viên",
          title: "Kỹ thuật viên",
          path: "/technician",
          element: <TechnicianPage />,
          priority: 1,
        },
      ],
    },
  ],
};

registerModule(mod);
