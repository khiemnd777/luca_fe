import type { ModuleDescriptor } from "@core/module/types";
import { registerModule } from "@core/module/registry";

const mod: ModuleDescriptor = {
  id: "process",
  // routes: [
  //   {
  //     key: "process",
  //     permissions: ["process.view"],
  //     element: <OneColumnPage />,
  //     label: "Công đoạn",
  //     title: "Công đoạn",
  //     path: "/process",
  //     icon: <EmergencyIcon />,
  //     priority: 94,
  //   },
  // ],
};

registerModule(mod);
