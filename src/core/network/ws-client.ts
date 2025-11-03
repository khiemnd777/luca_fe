import { env } from "@core/config/env";
import { getAccessToken } from "@core/network/token-utils";

type Message = unknown;
type Listener = (data: Message) => void;

export type WSStatus = "idle" | "connecting" | "open" | "closed";

export class WSClient {
  private url: string;
  private ws: WebSocket | null = null;
  private status: WSStatus = "idle";
  private listeners = new Set<Listener>();
  private reconnectAttempts = 0;
  private heartbeatTimer: any = null;
  private lastPongAt = 0;

  constructor() {
    const token = getAccessToken();
    const qs = new URLSearchParams();
    if (token) qs.set("token", token);

    // Tạo URL socket đầy đủ: ws://127.0.0.1:7999/api/ws?token=...
    this.url = `${env.wsBaseUrl}${qs.toString() ? `?${qs}` : ""
      }`;
  }

  connect() {
    if (this.status === "connecting" || this.status === "open") return;
    this.status = "connecting";

    this.ws = new WebSocket(this.url);
    this.ws.onopen = () => {
      this.status = "open";
      this.reconnectAttempts = 0;
      this.startHeartbeat();
    };

    this.ws.onmessage = (ev) => {
      // Nếu server reply 'pong' cho heartbeat
      if (typeof ev.data === "string" && ev.data === "pong") {
        this.lastPongAt = Date.now();
        return;
      }
      let payload: Message = ev.data;
      try { payload = JSON.parse(ev.data as string); } catch { }
      this.emit(payload);
    };

    this.ws.onclose = () => {
      this.status = "closed";
      this.stopHeartbeat();
      this.scheduleReconnect();
    };

    this.ws.onerror = () => {
      // Close sẽ kích hoạt sau onerror => không reconnect ở đây
    };
  }

  private scheduleReconnect() {
    this.reconnectAttempts++;
    const backoff = Math.min(1000 * 2 ** (this.reconnectAttempts - 1), 15000);
    setTimeout(() => this.connect(), backoff);
  }

  private startHeartbeat() {
    this.lastPongAt = Date.now();
    this.heartbeatTimer = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        // gửi 'ping', server nên trả 'pong'
        this.ws.send("ping");
        // nếu >30s không pong → đóng để reconnect
        if (Date.now() - this.lastPongAt > 30000) {
          this.ws.close();
        }
      }
    }, 10000);
  }

  private stopHeartbeat() {
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    this.heartbeatTimer = null;
  }

  send(obj: any) {
    const data = typeof obj === "string" ? obj : JSON.stringify(obj);
    if (this.ws?.readyState === WebSocket.OPEN) this.ws.send(data);
  }

  on(fn: Listener) { this.listeners.add(fn); return () => this.listeners.delete(fn); }
  private emit(data: Message) { this.listeners.forEach((fn) => fn(data)); }

  close() {
    this.stopHeartbeat();
    this.ws?.close();
    this.ws = null;
    this.status = "closed";
  }

  getStatus(): WSStatus { return this.status; }
}

// Singleton nếu muốn dùng chung
export const wsClient = new WSClient();
