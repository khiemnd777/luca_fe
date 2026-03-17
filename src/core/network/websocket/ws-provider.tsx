import { useEffect } from "react";
import { wsClient } from "./ws-client";
import {
  hasUsableAccessToken,
  subscribeAuthEvents,
} from "@core/network/auth-session";

type Props = {
  children: React.ReactNode;
};

export function WebSocketProvider({ children }: Props) {
  useEffect(() => {
    if (hasUsableAccessToken()) {
      wsClient.resume();
    } else {
      wsClient.shutdown();
    }

    const offAuth = subscribeAuthEvents((event) => {
      if (event.type === "login" || event.type === "token_refreshed") {
        wsClient.resume();
        return;
      }

      if (event.type === "logout" || event.type === "refresh_failed") {
        wsClient.shutdown();
      }
    });

    return () => {
      offAuth();
      wsClient.shutdown();
    };
  }, []);

  return <>{children}</>;
}
