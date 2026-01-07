import { env } from "@core/config/env";
import { getAccessToken, getRefreshToken } from "@core/network/token-utils";
import { refreshAccessToken } from "./auth-api";

type Message = unknown;
type Listener = (data: Message) => void;

export type WSStatus = "idle" | "connecting" | "open" | "closed";

export class WSClient {
  private ws: WebSocket | null = null;
  private status: WSStatus = "idle";
  private listeners = new Set<Listener>();
  private reconnectAttempts = 0;
  private heartbeatTimer: any = null;
  private lastPongAt = 0;

  private refreshing = false;

  private buildUrl(): string | null {
    const token = getAccessToken();
    if (!token) return null;

    const qs = new URLSearchParams({ token });
    return `${env.wsBaseUrl}?${qs}`;
  }

  connect() {
    if (this.status === "connecting" || this.status === "open") return;

    const url = this.buildUrl();
    if (!url) return;

    this.status = "connecting";
    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      this.status = "open";
      this.reconnectAttempts = 0;
      this.startHeartbeat();
    };

    this.ws.onmessage = (ev) => {
      if (typeof ev.data === "string" && ev.data === "pong") {
        this.lastPongAt = Date.now();
        return;
      }

      let payload: Message = ev.data;
      try {
        payload = JSON.parse(ev.data as string);
      } catch { }

      this.emit(payload);
    };

    this.ws.onclose = async (ev) => {
      this.status = "closed";
      this.stopHeartbeat();

      // auth close
      if (ev.reason === "token_expired") {
        await this.handleTokenExpired();
        return;
      }

      // network / gateway / unknown
      this.scheduleReconnect();
    };

    this.ws.onerror = () => {
      // onclose will handle
    };
  }

  private async handleTokenExpired() {
    if (this.refreshing) return;
    this.refreshing = true;

    try {
      const refreshToken = getRefreshToken();
      await refreshAccessToken(refreshToken);
      this.refreshing = false;
      this.connect(); // reconnect with new token
    } catch {
      this.refreshing = false;
      this.close();
    }
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
        this.ws.send("ping");
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

  send(data: any) {
    const msg = typeof data === "string" ? data : JSON.stringify(data);
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(msg);
    }
  }

  on(fn: Listener) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private emit(data: Message) {
    this.listeners.forEach((fn) => fn(data));
  }

  close() {
    this.stopHeartbeat();
    this.ws?.close();
    this.ws = null;
    this.status = "closed";
  }

  getStatus(): WSStatus {
    return this.status;
  }
}

export const wsClient = new WSClient();
