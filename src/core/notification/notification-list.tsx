import { useEffect, useRef, useState } from "react";
import { Box, CircularProgress, List, ListItem, ListItemButton, Stack } from "@mui/material";
import type { NotificationModel } from "@core/notification/notification.model";
import { markAsRead, shortList } from "@core/notification/notification.api";
import { navigate } from "@core/navigation/navigate";
import { getNotificationRenderer } from "./notification-renderer";

type NotificationListProps = {
  onSelect?: (notification: NotificationModel) => void;
};

export default function NotificationList({ onSelect }: NotificationListProps) {
  const [notifications, setNotifications] = useState<NotificationModel[]>([]);
  const [loading, setLoading] = useState(false);
  const reqCounter = useRef(0);

  useEffect(() => {
    let isActive = true;
    const cur = ++reqCounter.current;

    setLoading(true);
    shortList()
      .then((items) => {
        if (!isActive || cur !== reqCounter.current) return;
        setNotifications(items ?? []);
      })
      .catch(() => {
        if (!isActive || cur !== reqCounter.current) return;
        setNotifications([]);
      })
      .finally(() => {
        if (!isActive || cur !== reqCounter.current) return;
        setLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, []);

  const handleMarkAsRead = (notification: NotificationModel) => {
    if (!notification.id) return;
    markAsRead(notification.id)
      .then((updated) => {
        if (!updated) return;
        setNotifications((prev) =>
          prev.map((item) => (item.id === notification.id ? { ...item, ...updated } : item))
        );
      })
      .catch(() => undefined);
  };

  const handleNavigate = (notification: NotificationModel, action?: string) => {
    const data = notification.data as { href?: string; action?: string } | undefined;
    const target = action ?? data?.href ?? data?.action;
    if (typeof target !== "string" || target.trim() === "") return;
    navigate(target);
  };

  const handleClick = (notification: NotificationModel) => {
    handleMarkAsRead(notification);
    handleNavigate(notification);
    onSelect?.(notification);
  };

  return (
    <List disablePadding>
      {loading ? (
        <ListItem disableGutters>
          <Box sx={{ display: "flex", justifyContent: "center", width: "100%", py: 2 }}>
            <CircularProgress size={20} />
          </Box>
        </ListItem>
      ) : null}
      {notifications.map((notification, index) => {
        const entry =
          getNotificationRenderer(notification.type ?? "") ||
          getNotificationRenderer("__default__");

        const renderer =
          entry?.renderer ??
          ((item: NotificationModel) => <span>{item.title ?? ""}</span>);

        const content = renderer(notification, {
          markAsRead: () => handleMarkAsRead(notification),
          onAction: (action) => handleNavigate(notification, action),
        });

        const key =
          notification.id ??
          `${notification.type ?? "notification"}:${notification.createdAt ?? ""}:${index}`;

        return (
        <ListItem key={key} disablePadding>
          <ListItemButton onClick={() => handleClick(notification)}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ width: "100%" }}>
              {entry?.icon ? (
                <Box sx={{ display: "flex", alignItems: "center" }}>{entry.icon}</Box>
              ) : null}
              <Box sx={{ flex: 1 }}>{content}</Box>
            </Stack>
          </ListItemButton>
        </ListItem>
        );
      })}
    </List>
  );
}
