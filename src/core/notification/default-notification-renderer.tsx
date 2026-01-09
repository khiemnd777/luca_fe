import type { NotificationRenderer } from "@core/notification/notification-renderer";
import NotificationItem from "@core/notification/notification-item";

const DefaultNotificationRenderer: NotificationRenderer = (notification, ctx) => (
  <NotificationItem
    title={notification.title ?? ""}
    body={notification.body ?? ""}
    unread={notification.readAt === null}
    onClick={ctx.onClick}
    icon={ctx.icon}
  />
);

export default DefaultNotificationRenderer;
