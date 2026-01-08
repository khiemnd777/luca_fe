import type { NotificationRenderer } from "@core/notification/notification-renderer";
import NotificationItem from "@core/notification/notification-item";

const DefaultNotificationRenderer: NotificationRenderer = (notification) => (
  <NotificationItem
    title={notification.title ?? ""}
    body={notification.body ?? ""}
    unread={notification.readAt === null}
  />
);

export default DefaultNotificationRenderer;
