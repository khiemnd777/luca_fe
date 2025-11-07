import React from "react";
import type { ModuleDescriptor } from "@root/core/module/types";
import { registerModule } from "@root/core/module/registry";
import EmergencyIcon from '@mui/icons-material/Emergency';

const UnderConstructionPage = React.lazy(() => import("@core/pages/under-construction-page"));

const mod: ModuleDescriptor = {
  id: "clinic",
  routes: [
    {
      key: "clinic",
      label: "Nha khoa",
      title: "Nha khoa",
      path: "/clinic",
      element: <UnderConstructionPage />,
      icon: <EmergencyIcon />,
      priority: 94,
    },
  ],
};

registerModule(mod);
