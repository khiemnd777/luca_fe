import React from "react";
import type { ModuleDescriptor } from "@root/core/module/types";
import { registerModule } from "@root/core/module/registry";
import CategoryIcon from '@mui/icons-material/Category';

const UnderConstructionPage = React.lazy(() => import("@core/pages/under-construction-page"));

const mod: ModuleDescriptor = {
  id: "material",
  routes: [
    {
      key: "material",
      label: "Vật tư",
      title: "Vật tư",
      path: "/material",
      element: <UnderConstructionPage />,
      icon: <CategoryIcon />,
      priority: 99,
    },
  ],
};

registerModule(mod);
