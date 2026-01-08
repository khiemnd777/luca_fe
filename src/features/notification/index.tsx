import type { ModuleDescriptor } from "@root/core/module/types";
import { registerModule } from "@root/core/module/registry";
import NotificationsIcon from '@mui/icons-material/Notifications';

const mod: ModuleDescriptor = {
  id: "notification",
  routes: [
    {
      key: "notification",
      label: "Thông báo",
      title: "Thông báo",
      path: "/notification",
      icon: <NotificationsIcon />,
      priority: 9998,
    },
  ],
};

registerModule(mod);
