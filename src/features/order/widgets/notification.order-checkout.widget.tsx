import type { MouseEvent } from "react";
import ChecklistIcon from "@mui/icons-material/Checklist";
import { Button } from "@mui/material";
import NotificationItem from "@core/notification/notification-item";
import { registerNotificationRenderer, type NotificationRenderer } from "@core/notification/notification-renderer";

type OrderCreatedNotificationData = {
  orderId?: number | string;
  orderCode?: string;
  code?: string;
  href?: string;
};

const OrderCreatedNotificationRenderer: NotificationRenderer<OrderCreatedNotificationData> = (
  notification,
  ctx
) => {
  const data = notification.data;
  const orderCode = data?.orderCode ?? data?.code;
  const title = notification.title ?? "Đơn hàng mới";
  const body = orderCode ? `Mã đơn: ${orderCode}` : notification.body ?? "";
  const href = data?.href ?? (data?.orderId ? `/order/${data.orderId}` : "");

  const handleAction = (event: MouseEvent) => {
    event.stopPropagation();
    if (!href) return;
    ctx.onAction?.(href);
  };

  return (
    <NotificationItem
      title={title}
      body={body}
      unread={notification.readAt === null}
      right={
        <Button size="small" onClick={handleAction} disabled={!href}>
          Xem đơn
        </Button>
      }
    />
  );
};

registerNotificationRenderer(
  "order:checkout",
  OrderCreatedNotificationRenderer,
  <ChecklistIcon color="primary" />
);

export default OrderCreatedNotificationRenderer;
