import { env } from "@core/config/env";
import { getAccessToken, getRefreshToken } from "@core/network/token-utils";
import { refreshAccessToken } from "../auth-api";

type Message = unknown;
type Listener = (data: Message) => void;

export type WSStatus = "idle" | "connecting" | "open" | "closed";

export class WSClient {
  private ws: WebSocket | null = null;
  private status: WSStatus = "idle";
  private listeners = new Set<Listener>();

  private reconnectAttempts = 0;
  private reconnectTimer: any = null;
  private refreshing = false;

  // heartbeat (message-level)
  private hbTimer: any = null;
  private readonly clientPingPeriodMs = 20000; // must be < server pongWait (60s), keep it stable

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

      // start client heartbeat
      this.startHeartbeat();
    };

    this.ws.onmessage = (ev) => {
      // message-level heartbeat with server
      if (typeof ev.data === "string") {
        if (ev.data === "ping") {
          // reply immediately, and DO NOT emit
          try {
            this.ws?.send("pong");
          } catch {}
          return;
        }
        if (ev.data === "pong") {
          // ignore, do not emit
          return;
        }
      }

      let payload: Message = ev.data;
      if (typeof ev.data === "string") {
        try {
          payload = JSON.parse(ev.data);
        } catch {
          payload = ev.data;
        }
      }
      this.emit(payload);
    };

    this.ws.onclose = async (ev) => {
      this.stopHeartbeat();

      this.status = "closed";
      this.ws = null;

      if (ev.reason === "token_expired") {
        await this.handleTokenExpired();
        return;
      }

      this.scheduleReconnect();
    };

    this.ws.onerror = () => {
      // onclose handles reconnect
    };
  }

  private startHeartbeat() {
    if (this.hbTimer) return;

    this.hbTimer = setInterval(() => {
      if (this.ws?.readyState !== WebSocket.OPEN) return;
      try {
        // client-initiated ping helps keep connection alive even if server ping is lost by proxy
        this.ws.send("ping");
      } catch {}
    }, this.clientPingPeriodMs);
  }

  private stopHeartbeat() {
    if (this.hbTimer) {
      clearInterval(this.hbTimer);
      this.hbTimer = null;
    }
  }

  private async handleTokenExpired() {
    if (this.refreshing) return;
    this.refreshing = true;

    try {
      const refreshToken = getRefreshToken();
      await refreshAccessToken(refreshToken);
      this.refreshing = false;
      this.connect();
    } catch {
      this.refreshing = false;
      this.close();
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) return;

    this.reconnectAttempts++;
    const backoff = Math.min(1000 * 2 ** (this.reconnectAttempts - 1), 15000);

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, backoff);
  }

  send(data: any) {
    if (this.ws?.readyState !== WebSocket.OPEN) return;

    const msg = typeof data === "string" ? data : JSON.stringify(data);
    this.ws.send(msg);
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

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    // Important: prevent auto reconnect after manual close
    this.reconnectAttempts = 0;

    this.ws?.close();
    this.ws = null;
    this.status = "closed";
  }

  getStatus(): WSStatus {
    return this.status;
  }
}

export const wsClient = new WSClient();
