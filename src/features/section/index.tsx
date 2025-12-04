import type { ModuleDescriptor } from "@root/core/module/types";
import { registerModule } from "@root/core/module/registry";
import MapsHomeWorkIcon from '@mui/icons-material/MapsHomeWork';

const mod: ModuleDescriptor = {
  id: "section",
  routes: [
    {
      key: "section",
      permissions: ["staff.view"],
      label: "Phòng ban",
      title: "Phòng ban",
      subtitle: "Đơn vị chuyên đảm nhận việc gia công, sản xuất và lắp ráp các thiết bị, chi tiết nha khoa theo yêu cầu kỹ thuật.",
      path: "/section",
      icon: <MapsHomeWorkIcon />,
      priority: 95,
    },
  ],
};

registerModule(mod);
