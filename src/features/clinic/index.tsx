import React from "react";
import type { ModuleDescriptor } from "@root/core/module/types";
import { registerModule } from "@root/core/module/registry";
import EmergencyIcon from '@mui/icons-material/Emergency';

const ClinicPage = React.lazy(() => import("@features/clinic/presentation/pages/clinic-page"));

const mod: ModuleDescriptor = {
  id: "clinic",
  routes: [
    {
      path: "/clinic",
      element: <ClinicPage />,
    },
  ],
  menuItems: [
    {
      key: "clinic",
      label: "Nha khoa",
      to: "/clinic",
      icon: <EmergencyIcon />,
      priority: 94,
    },
  ],
};

registerModule(mod);
