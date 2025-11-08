import React from "react";
import type { ModuleDescriptor } from "@root/core/module/types";
import { registerModule } from "@root/core/module/registry";
import DeveloperBoardIcon from '@mui/icons-material/DeveloperBoard';

const UnderConstructionPage = React.lazy(() => import("@core/pages/under-construction-page"));

const mod: ModuleDescriptor = {
  id: "process",
  routes: [
    {
      key: "process",
      label: "Công đoạn",
      title: "Công đoạn",
      path: "/process",
      element: <UnderConstructionPage />,
      icon: <DeveloperBoardIcon />,
      priority: 97,
    },
  ],
};

registerModule(mod);
