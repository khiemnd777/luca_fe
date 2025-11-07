import React from "react";
import type { ModuleDescriptor } from "@root/core/module/types";
import { registerModule } from "@root/core/module/registry";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";

const SamplePage = React.lazy(() => import("@features/dashboard/presentation/pages/sample-page"));
const SampleTablePage = React.lazy(() => import("@features/dashboard/presentation/pages/sample-table-page"));
const UnderConstructionPage = React.lazy(() => import("@core/pages/under-construction-page"));


const mod: ModuleDescriptor = {
  id: "dashboard",
  routes: [
    {
      key: "home",
      label: "Dashboard",
      title: "Dashboard",
      path: "/",
      element: <UnderConstructionPage />,
      icon: <HomeRoundedIcon />,
      priority: 100,
      children: [
        {
          hidden: true,
          key: "sample",
          title: "Sample",
          path: "/sample",
          element: <SamplePage />,
        },
        {
          hidden: true,
          key: "sampleTable",
          title: "Sample Table",
          path: "/sample-table",
          element: <SampleTablePage />,
        },
      ],
    },
  ],
};

registerModule(mod);
