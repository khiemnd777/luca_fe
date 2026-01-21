import { useEffect } from "react";
import { wsClient } from "./ws-client";
import { getAccessToken } from "../token-utils";

type Props = {
  children: React.ReactNode;
};

export function WebSocketProvider({ children }: Props) {
  useEffect(() => {
    const token = getAccessToken();
    if (!token) return;

    wsClient.connect();

    return () => {
      wsClient.close();
    };
  }, []);

  return <>{children}</>;
}
