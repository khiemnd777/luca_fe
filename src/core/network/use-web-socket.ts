import { useEffect, useState } from "react";
import { wsClient } from "@core/network/ws-client";

export function useWebSocket<T = any>() {
  const [status, setStatus] = useState(wsClient.getStatus());
  const [lastMessage, setLastMessage] = useState<T | null>(null);

  useEffect(() => {
    wsClient.connect();
    const off = wsClient.on((msg) => setLastMessage(msg as T));

    const iv = setInterval(() => setStatus(wsClient.getStatus()), 500);
    return () => {
      off();
      clearInterval(iv);
      // Comment for WS global
      // wsClient.close();
    };
  }, []);

  return { status, lastMessage, send: (data: any) => wsClient.send(data) };
}

/*
// Ví dụ dùng trong component React:

import { useWebSocket } from "@core/network/use-websocket";
export default function RealtimePanel() {
  const { status, lastMessage, send } = useWebSocket<any>();

  return (
    <div>
      <div>WS: {status}</div>
      <pre>{lastMessage ? JSON.stringify(lastMessage, null, 2) : "—"}</pre>
      <button onClick={() => send({ type: "ping-ui", t: Date.now() })}>
        Send test
      </button>
    </div>
  );
}
*/