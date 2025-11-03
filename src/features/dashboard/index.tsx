import React from "react";
import type { ModuleDescriptor } from "@root/core/module/types";
import { registerModule } from "@root/core/module/registry";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";

const DashboardPage = React.lazy(() => import("@features/dashboard/presentation/pages/dashboard-page"));
const SettingsPage = React.lazy(() => import("@features/dashboard/presentation/pages/settings-page"));
const SamplePage = React.lazy(() => import("@features/dashboard/presentation/pages/sample-page"));
const SampleTablePage = React.lazy(() => import("@features/dashboard/presentation/pages/sample-table-page"));

const mod: ModuleDescriptor = {
  id: "dashboard",
  routes: [
    {
      path: "/",
      element: <DashboardPage />,
    },
    {
      path: "/settings",
      element: <SettingsPage />,
    },
    {
      path: "/sample",
      element: <SamplePage />,
    },
    {
      path: "/sample-table",
      element: <SampleTablePage />,
    }
  ],
  menuItems: [
    {
      key: "home",
      label: "Dashboard",
      to: "/",
      icon: <HomeRoundedIcon />,
      priority: 100,
    },
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
