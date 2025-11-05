import React from "react";
import type { ModuleDescriptor } from "@root/core/module/types";
import { registerModule } from "@root/core/module/registry";
import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";

const SettingsPage = React.lazy(() => import("@features/settings/presentation/pages/settings-page"));

const mod: ModuleDescriptor = {
  id: "settings",
  routes: [
    {
      path: "/settings",
      element: <SettingsPage />,
    },
  ],
  menuItems: [
    {
      key: "settings",
      label: "Thiết lập",
      to: "/settings",
      icon: <SettingsRoundedIcon />,
      priority: 0,
    },
  ],
};

registerModule(mod);
