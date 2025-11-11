import React from "react";
import type { ModuleDescriptor } from "@root/core/module/types";
import { registerModule } from "@root/core/module/registry";
import BadgeIcon from '@mui/icons-material/Badge';

const UnderConstructionPage = React.lazy(() => import("@core/pages/under-construction-page"));

const mod: ModuleDescriptor = {
  id: "staff",
  routes: [
    {
      key: "staff",
      label: "Nhân sự",
      title: "Nhân sự",
      subtitle: "Quản lý nhân sự",
      path: "/staff",
      element: <UnderConstructionPage />,
      icon: <BadgeIcon />,
      priority: 94,
      children: [
        {
          key: "section",
          label: "Bộ phận",
          title: "Bộ phận",
          subtitle: "Đơn vị chuyên đảm nhận việc gia công, sản xuất và lắp ráp các thiết bị, chi tiết nha khoa theo yêu cầu kỹ thuật.",
          path: "/section",
          priority: 99,
        },
      ],
    },
  ],
};

registerModule(mod);
