import type { ModuleDescriptor } from "@root/core/module/types";
import { registerModule } from "@root/core/module/registry";
import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";

const mod: ModuleDescriptor = {
  id: "settings",
  routes: [
    {
      key: "settings",
      permissions: ["settings.view"],
      label: "Thiết lập",
      title: "Thiết lập",
      subtitle: "Cấu hình thông tin trang quản lý và giao diện",
      path: "/settings",
      icon: <SettingsRoundedIcon />,
      priority: 0,
    },
  ],
};

registerModule(mod);
