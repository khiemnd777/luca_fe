import { useEffect } from "react";
import { useWebSocket } from "@root/core/network/websocket/use-web-socket";
import { invalidate } from "@core/hooks/use-async";
import { registerWS } from "@root/core/network/websocket/ws-widgets";

function NotificationWSWidget() {
  const { lastMessage } = useWebSocket();

  useEffect(() => {
    if (lastMessage?.type === "order:checkout") {
      invalidate("notification-unread-count");
      invalidate("notification-list");
      invalidate("notification-list-for-clear-all");
    }
  }, [lastMessage]);

  return null;
}

registerWS(<NotificationWSWidget />);
