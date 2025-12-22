import type { ModuleDescriptor } from "@core/module/types";
import { registerModule } from "@core/module/registry";
import OneColumnPage from "@root/core/pages/one-column-page";
import ChecklistIcon from '@mui/icons-material/Checklist';

const mod: ModuleDescriptor = {
  id: "order",
  routes: [
    {
      key: "order",
      permissions: ["order.view"],
      element: <OneColumnPage />,
      label: "Đơn hàng",
      title: "Đơn hàng",
      path: "/order",
      icon: <ChecklistIcon />,
      priority: 97,
      children: [
        {
          hidden: true,
          key: "order-detail",
          permissions: ["order.view", "order.edit"],
          label: "Chi tiết đơn hàng",
          title: "Chi tiết đơn hàng",
          path: "/order/:orderId",
          icon: <ChecklistIcon />,
          priority: 99,
        },
        {
          hidden: true,
          key: "order-detail-historical",
          permissions: ["order.view", "order.edit"],
          label: "Chi tiết đơn hàng",
          title: "Chi tiết đơn hàng",
          path: "/order/:orderId/historical/:orderItemId",
          icon: <ChecklistIcon />,
          priority: 99,
        },
        {
          hidden: true,
          key: "order-process-check-code",
          permissions: ["order.view", "order.edit"],
          label: "Check in / Check out",
          title: "Check in / Check out",
          path: "/order/check/:code",
          icon: <ChecklistIcon />,
          priority: 99,
        },
        {
          hidden: true,
          key: "order-process-inprogress",
          permissions: ["order.view", "order.edit"],
          label: "Công đoạn gia công",
          title: "Công đoạn gia công",
          path: "/order/:orderId/historical/:orderItemId/process/in-progresses",
          icon: <ChecklistIcon />,
          priority: 99,
        }
      ],
    },
    // {
    //   key: "order-process",
    //   permissions: ["order.view"],
    //   element: <OneColumnPage />,
    //   label: "Gia công",
    //   title: "Gia công",
    //   path: "/order/processing",
    //   icon: <DeveloperBoardIcon />,
    //   priority: 96,
    // }
  ],
};

registerModule(mod);
