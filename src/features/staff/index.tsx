import type { ModuleDescriptor } from "@root/core/module/types";
import { registerModule } from "@root/core/module/registry";
import BadgeIcon from '@mui/icons-material/Badge';

const mod: ModuleDescriptor = {
  id: "staff",
  routes: [
    {
      key: "staff",
      label: "Nhân sự",
      title: "Nhân sự",
      subtitle: "Quản lý nhân sự",
      path: "/staff",
      icon: <BadgeIcon />,
      priority: 94,
      children: [
        {
          key: "staff-detail",
          label: "Chi tiết nhân sự",
          title: "Chi tiết Nhân sự",
          subtitle: "Thay đổi thông tin, mật khẩu, và theo dõi tiến độ gia công.",
          path: "/staff/:staffId",
          icon: <BadgeIcon />,
          hidden: true,
          priority: 99,
        },
        {
          key: "section",
          label: "Bộ phận",
          title: "Bộ phận",
          subtitle: "Đơn vị chuyên đảm nhận việc gia công, sản xuất và lắp ráp các thiết bị, chi tiết nha khoa theo yêu cầu kỹ thuật.",
          path: "/section",
          priority: 98,
        },
      ],
    },
  ],
};

registerModule(mod);
