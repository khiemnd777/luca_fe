import React from "react";
import type { ModuleDescriptor } from "@root/core/module/types";
import { registerModule, registerSlot } from "@root/core/module/registry";
import LeaderboardIcon from "@mui/icons-material/Leaderboard";
import { ActiveCasesStatWidget } from "@features/dashboard/widgets/stat-active-cases.widget";
import { CasesCompletedStatWidget } from "@features/dashboard/widgets/stat-cases-completed.widget";
import { AvgTurnaroundStatWidget } from "@features/dashboard/widgets/stat-avg-turnaround.widget";
import { RemakesStatWidget } from "@features/dashboard/widgets/stat-remakes.widget";

const DashboardPage = React.lazy(() => import("@features/dashboard/presentation/pages/dashboard-page"));
const SamplePage = React.lazy(() => import("@features/dashboard/presentation/pages/sample-page"));
const SampleCreatableStatusBoardPage = React.lazy(() => import("@features/dashboard/presentation/pages/sample-status-board"));
const SampleTablePage = React.lazy(() => import("@features/dashboard/presentation/pages/sample-table-page"));

const mod: ModuleDescriptor = {
  id: "dashboard",
  routes: [
    {
      key: "dashboard",
      label: "Dashboard",
      title: "Dashboard",
      path: "/",
      element: <DashboardPage />,
      icon: <LeaderboardIcon />,
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
          key: "status-board",
          title: "Creatable Status Board",
          path: "/status-board",
          element: <SampleCreatableStatusBoardPage />,
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

registerSlot({
  id: "dashboard-stat-active-cases",
  name: "dashboard:stat",
  render: () => <ActiveCasesStatWidget />,
});

registerSlot({
  id: "dashboard-stat-cases-completed",
  name: "dashboard:stat",
  render: () => <CasesCompletedStatWidget />,
});

registerSlot({
  id: "dashboard-stat-avg-turnaround",
  name: "dashboard:stat",
  render: () => <AvgTurnaroundStatWidget />,
});

registerSlot({
  id: "dashboard-stat-remakes",
  name: "dashboard:stat",
  render: () => <RemakesStatWidget />,
});
