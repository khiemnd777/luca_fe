import React from "react";
import type { ModuleDescriptor } from "@root/core/module/types";
import { registerModule } from "@root/core/module/registry";
import ContactEmergencyIcon from '@mui/icons-material/ContactEmergency';

const UnderConstructionPage = React.lazy(() => import("@core/pages/under-construction-page"));

const mod: ModuleDescriptor = {
  id: "dentist",
  routes: [
    {
      key: "dentist",
      label: "Nha sĩ",
      title: "Nha sĩ",
      path: "/dentist",
      element: <UnderConstructionPage />,
      icon: <ContactEmergencyIcon />,
      priority: 94,
    },
  ],
};

registerModule(mod);
