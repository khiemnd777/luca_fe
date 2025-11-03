import React from "react";
import type { ModuleDescriptor } from "@root/core/module/types";
import { registerModule } from "@root/core/module/registry";
import ContactEmergencyIcon from '@mui/icons-material/ContactEmergency';

const DentistPage = React.lazy(() => import("@features/dentist/presentation/pages/dentist-page"));

const mod: ModuleDescriptor = {
  id: "dentist",
  routes: [
    {
      path: "/dentist",
      element: <DentistPage />,
    },
  ],
  menuItems: [
    {
      key: "dentist",
      label: "Nha sĩ",
      to: "/dentist",
      icon: <ContactEmergencyIcon />,
      priority: 94,
    },
  ],
};

registerModule(mod);
