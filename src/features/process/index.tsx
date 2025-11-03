import React from "react";
import type { ModuleDescriptor } from "@root/core/module/types";
import { registerModule } from "@root/core/module/registry";
import DeveloperBoardIcon from '@mui/icons-material/DeveloperBoard';

const ProcessPage = React.lazy(() => import("@features/process/presentation/pages/process-page"));

const mod: ModuleDescriptor = {
  id: "process",
  routes: [
    {
      path: "/process",
      element: <ProcessPage />,
    },
  ],
  menuItems: [
    {
      key: "process",
      label: "Công đoạn",
      to: "/process",
      icon: <DeveloperBoardIcon />,
      priority: 97,
    },
  ],
};

registerModule(mod);
