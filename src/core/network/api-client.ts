import axios, {
  AxiosHeaders,
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios";
import { getAccessToken, getRefreshToken, saveAccessToken } from "@core/network/token-utils";
import { refreshAccessToken } from "@core/network/auth-api";
import type { FetchTableOpts } from "@core/table/table.types";
import { mapper } from "../mapper/auto-mapper";

/** =========================
 *  Global (singleton + state)
 *  ========================= */
declare global {
  // eslint-disable-next-line no-var
  var __API_CLIENT_SINGLETON__: ApiClient | undefined;
}
let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;
const requestQueue: Array<(token: string | null) => void> = [];
let lastRefreshFailedAt: number | null = null;

/** =========================
 *  Constants
 *  ========================= */
const EARLY_REFRESH_S = 30;
const BC_RACE_MS = 200;
const REFRESH_HARD_TIMEOUT_MS = 6000;
const LOGIN_PATH = "/login";

/** =========================
 *  Broadcast đa tab
 *  ========================= */
const bc = typeof window !== "undefined" && "BroadcastChannel" in window ? new BroadcastChannel("auth") : null;
function broadcast(type: "token_refreshed" | "logout" | "refresh_failed", token?: string | null) {
  try { bc?.postMessage(type === "token_refreshed" ? { type, token } : { type }); } catch { }
}

/** =========================
 *  Utils
 *  ========================= */
function isOnLogin(): boolean {
  try { return typeof window !== "undefined" && window.location?.pathname?.startsWith(LOGIN_PATH); } catch { return false; }
}
function getTokenExpSec(token?: string | null): number | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  try {
    const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
    return typeof payload?.exp === "number" ? payload.exp : null;
  } catch { return null; }
}
function secondsUntilExpiry(token?: string | null): number | null {
  const exp = getTokenExpSec(token);
  if (!exp) return null;
  const now = Math.floor(Date.now() / 1000);
  return exp - now;
}

export function isAuthRefreshing(): boolean { return isRefreshing; }
export function hasUsableAccessToken(): boolean {
  const t = getAccessToken();
  const exp = getTokenExpSec(t);
  if (!exp) return false;
  const now = Math.floor(Date.now() / 1000);
  return exp > now;
}
export function didLastRefreshFail(): boolean {
  return !!lastRefreshFailedAt && Date.now() - lastRefreshFailedAt < 5 * 60 * 1000;
}
function markRefreshFail() {
  lastRefreshFailedAt = Date.now();
  broadcast("refresh_failed");
}
function clearRefreshFailFlag() { lastRefreshFailedAt = null; }

/** =========================
 *  Bootstrap: dọn AT hết hạn
 *  ========================= */
(function bootstrapTokenSanity() {
  const t = getAccessToken();
  const remain = secondsUntilExpiry(t);
  if (t && (remain === null || remain <= 0)) {
    try { saveAccessToken(""); } catch { }
  }
})();

/** =========================
 *  Race short từ tab khác
 *  ========================= */
function waitExternalRefreshShort(): Promise<string | null> {
  return new Promise((resolve) => {
    if (!bc) return resolve(null);
    const timer = setTimeout(() => {
      try { bc.removeEventListener("message", handler); } catch { }
      resolve(null);
    }, BC_RACE_MS);
    const handler = (ev: MessageEvent) => {
      if (ev.data?.type === "token_refreshed") {
        clearTimeout(timer); bc.removeEventListener("message", handler);
        resolve(ev.data.token ?? null);
      }
      if (ev.data?.type === "logout" || ev.data?.type === "refresh_failed") {
        clearTimeout(timer); bc.removeEventListener("message", handler);
        resolve(null);
      }
    };
    bc.addEventListener("message", handler);
  });
}
function isRefreshRequest(config?: AxiosRequestConfig | null) {
  const url = config?.url ?? "";
  return url.includes("/auth/refresh") || url.includes("/refresh-token");
}

/** =========================
 *  Queue helpers
 *  ========================= */
function flushQueue(newToken: string | null) {
  while (requestQueue.length) {
    const fn = requestQueue.shift()!;
    try { fn(newToken); } catch { }
  }
}
function failQueue() {
  while (requestQueue.length) {
    const fn = requestQueue.shift()!;
    try { fn(null); } catch { }
  }
}

/** =========================
 *  Timeout wrapper
 *  ========================= */
function withTimeout<T>(p: Promise<T>, ms: number): Promise<T | "__TIMEOUT__"> {
  return Promise.race([p, new Promise<"__TIMEOUT__">((res) => setTimeout(() => res("__TIMEOUT__"), ms))]);
}

/** =========================
 *  Refresh logic
 *  ========================= */
async function doRefreshOnce(): Promise<string | null> {
  if (refreshPromise) return refreshPromise;

  isRefreshing = true;
  const core = (async () => {
    try {
      if (isOnLogin()) return null;

      const external = await waitExternalRefreshShort();
      if (external) { saveAccessToken(external); clearRefreshFailFlag(); return external; }

      const rt = getRefreshToken();
      if (!rt) return null;

      const newToken = await refreshAccessToken(rt);
      if (newToken) {
        saveAccessToken(newToken);
        broadcast("token_refreshed", newToken);
        clearRefreshFailFlag();
        return newToken;
      }
      return null;
    } catch {
      return null;
    }
  })();

  const raced = withTimeout(core, REFRESH_HARD_TIMEOUT_MS).then((r) => (r === "__TIMEOUT__" ? null : r));
  refreshPromise = raced;

  raced.then((token) => {
    isRefreshing = false; refreshPromise = null;
    if (token) flushQueue(token);
    else { markRefreshFail(); failQueue(); }
  }).catch(() => {
    isRefreshing = false; refreshPromise = null;
    markRefreshFail(); failQueue();
  });

  return raced;
}

/** =========================
 *  ApiClient (singleton)
 *  ========================= */
export class ApiClient {
  private readonly instance: AxiosInstance;
  private constructor(axiosInstance: AxiosInstance) { this.instance = axiosInstance; }

  static create(): ApiClient {
    // Singleton thật sự (chống HMR/dev tạo nhiều instance gây flicker do request lặp)
    if (globalThis.__API_CLIENT_SINGLETON__) return globalThis.__API_CLIENT_SINGLETON__;

    const axiosInstance = axios.create({
      baseURL: "",
      headers: { "Content-Type": "application/json" },
      timeout: 10000,
    });

    // ----- Request interceptor (DUY NHẤT) -----
    axiosInstance.interceptors.request.use(
      async (config: InternalAxiosRequestConfig): Promise<InternalAxiosRequestConfig> => {
        const ensureHeaders = () => {
          if (!config.headers) config.headers = new AxiosHeaders();
          return config.headers as AxiosHeaders | Record<string, any>;
        };
        const setAuth = (token: string) => {
          const h = ensureHeaders();
          if (typeof (h as any).set === "function") (h as AxiosHeaders).set("Authorization", `Bearer ${token}`);
          else (config.headers as any) = { ...(config.headers as any), Authorization: `Bearer ${token}` };
        };

        const isRefresh = isRefreshRequest(config);
        const at = getAccessToken();
        const remain = secondsUntilExpiry(at);

        if (at && (remain === null || remain <= 0)) {
          try { saveAccessToken(""); } catch { }
        }

        if (at && remain !== null && remain > 0 && !isRefresh) {
          setAuth(at);
          if (remain <= EARLY_REFRESH_S && !isRefreshing && !isOnLogin()) void doRefreshOnce();
          return config;
        }

        if (!isRefresh && getRefreshToken()) {
          if (!isRefreshing) void doRefreshOnce();
          return new Promise<InternalAxiosRequestConfig>((resolve) => {
            requestQueue.push((newToken) => {
              if (newToken) setAuth(newToken);
              resolve(config);
            });
          });
        }

        return config;
      }
    );

    // ----- Response interceptor -----
    axiosInstance.interceptors.response.use(
      (response) => response,
      async (error) => {
        const original: InternalAxiosRequestConfig & { _retry?: boolean } = error?.config ?? {};
        const status = error?.response?.status as number | undefined;

        if ((status === 401 || status === 403) && !original._retry && !isRefreshRequest(original) && getRefreshToken()) {
          original._retry = true;
          const newToken = await doRefreshOnce();
          if (newToken) {
            const headers = new AxiosHeaders(original.headers as any);
            headers.set("Authorization", `Bearer ${newToken}`);
            original.headers = headers;
            return axiosInstance.request(original);
          }
        }
        return Promise.reject(error);
      }
    );

    const client = new ApiClient(axiosInstance);
    globalThis.__API_CLIENT_SINGLETON__ = client;
    return client;
  }

  // ====== Wrapped HTTP (with retry) ======
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.withRetry(() => this.instance.get<T>(url, config));
  }
  async getTable<T>(url: string, tableOpts: FetchTableOpts, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    const tableOptsDto = mapper.map<FetchTableOpts, any>("FetchTableOpts", tableOpts, "model_to_dto");
    return this.withRetry(() => this.instance.get<T>(url, { params: tableOptsDto, ...config }));
  }
  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.withRetry(() => this.instance.post<T>(url, data, config));
  }
  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.withRetry(() => this.instance.put<T>(url, data, config));
  }
  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.withRetry(() => this.instance.delete<T>(url, config));
  }

  private async withRetry<T>(
    requestFn: () => Promise<AxiosResponse<T>>,
    maxAttempts = 3,
    delayMs = 1000
  ): Promise<AxiosResponse<T>> {
    let attempt = 0;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      try {
        const res = await requestFn();
        if (res.data && typeof res.data === "object" && (res.data as any).statusCode === 102) {
          throw new Error((res.data as any).statusMessage || "Service message");
        }
        return res;
      } catch (err: any) {
        attempt++;
        const status = err?.response?.status as number | undefined;
        const isAuthError = status === 401 || status === 403;
        const retryable =
          err?.code === "ECONNABORTED" ||
          err?.message?.includes("timeout") ||
          (typeof status === "number" && status >= 500 && status !== 501);

        if (!retryable || attempt >= maxAttempts) {
          if (!isAuthError) console.error(`[Axios] Request failed after ${attempt} attempts`, err);
          throw err;
        }
        const jitter = Math.floor(Math.random() * 200);
        await new Promise((r) => setTimeout(r, delayMs + jitter));
      }
    }
  }
}

// Singleton export
export const apiClient = ApiClient.create();
