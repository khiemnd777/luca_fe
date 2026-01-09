import { useEffect, useRef } from "react";
import { wsClient } from "@root/core/network/websocket/ws-client";
import { getAccessToken } from "../token-utils";


type Props = {
  children: React.ReactNode;
};

export function WebSocketProvider({ children }: Props) {
  const accessToken = getAccessToken();
  const prevTokenRef = useRef<string | null>(null);

  useEffect(() => {
    if (!accessToken) {
      wsClient.close();
      prevTokenRef.current = null;
      return;
    }

    if (prevTokenRef.current !== accessToken) {
      wsClient.close();
      wsClient.connect();
      prevTokenRef.current = accessToken;
    }
  }, [accessToken]);

  return <>{children}</>;
}
