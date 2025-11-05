import axios, {
  AxiosHeaders,
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios";
import { clearTokens, getAccessToken, getRefreshToken, saveAccessToken } from "@core/network/token-utils";
import { refreshAccessToken } from "@core/network/auth-api";

// ==============================
// ⚙️ Global state
// ==============================
let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;
let loggingOut = false;

// Hàng đợi các request bị tạm dừng trong lúc refresh
const requestQueue: Array<(token: string | null) => void> = [];

// ==============================
// ⚙️ Constants (tối ưu hiệu suất)
// ==============================
const EARLY_REFRESH_S = 30; // refresh sớm khi token còn < 30s
const BC_RACE_MS = 200; // chờ broadcast tối đa 200ms
const QUEUE_MAX_WAIT_MS = 300; // mỗi request chỉ pause tối đa 300ms

// ==============================
// ⚙️ Broadcast đa tab
// ==============================
const bc = typeof window !== "undefined" && "BroadcastChannel" in window ? new BroadcastChannel("auth") : null;

function broadcastToken(token: string | null) {
  try {
    bc?.postMessage(token ? { type: "token_refreshed", token } : { type: "logout" });
  } catch { }
}

// ==============================
// ⚙️ JWT util
// ==============================
function getTokenExpSec(token?: string | null): number | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  try {
    const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
    return typeof payload?.exp === "number" ? payload.exp : null;
  } catch {
    return null;
  }
}

function secondsUntilExpiry(token?: string | null): number | null {
  const exp = getTokenExpSec(token);
  if (!exp) return null;
  const now = Math.floor(Date.now() / 1000);
  return exp - now;
}

// ==============================
// ⚙️ Wait external refresh (race 200ms)
// ==============================
function waitExternalRefreshShort(): Promise<string | null> {
  return new Promise((resolve) => {
    if (!bc) return resolve(null);
    const timer = setTimeout(() => {
      try {
        bc.removeEventListener("message", handler);
      } catch { }
      resolve(null);
    }, BC_RACE_MS);

    const handler = (ev: MessageEvent) => {
      if (ev.data?.type === "token_refreshed") {
        clearTimeout(timer);
        bc.removeEventListener("message", handler);
        resolve(ev.data.token ?? null);
      }
      if (ev.data?.type === "logout") {
        clearTimeout(timer);
        bc.removeEventListener("message", handler);
        resolve(null);
      }
    };
    bc.addEventListener("message", handler);
  });
}

// ==============================
// ⚙️ Refresh logic
// ==============================
async function doRefreshOnce(): Promise<string | null> {
  if (refreshPromise) return refreshPromise;

  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      // Race: chờ token từ tab khác tối đa 200ms
      const external = await waitExternalRefreshShort();
      if (external) {
        saveAccessToken(external);
        return external;
      }

      const rt = getRefreshToken();
      if (!rt) return null;

      const newToken = await refreshAccessToken(rt);
      if (newToken) {
        saveAccessToken(newToken);
        broadcastToken(newToken);
        return newToken;
      }
      return null;
    } catch {
      return null;
    } finally {
      // Clear ở response interceptor sau khi flushQueue
    }
  })();

  return refreshPromise;
}

function flushQueue(token: string | null) {
  while (requestQueue.length) {
    const resume = requestQueue.shift()!;
    try {
      resume(token);
    } catch { }
  }
}

function logoutOnce() {
  if (loggingOut) return;
  loggingOut = true;
  try {
    clearTokens();
    broadcastToken(null);
  } finally {
    window.location.href = "/login";
  }
}

function isRefreshRequest(config?: AxiosRequestConfig | null) {
  const url = config?.url ?? "";
  return url.includes("/auth/refresh") || url.includes("/refresh-token");
}

// ==============================
// ⚙️ ApiClient
// ==============================
export class ApiClient {
  private readonly instance: AxiosInstance;

  private constructor(axiosInstance: AxiosInstance) {
    this.instance = axiosInstance;
  }

  static create(): ApiClient {
    const axiosInstance = axios.create({
      baseURL: "",
      headers: { "Content-Type": "application/json" },
      timeout: 10000,
    });

    // ----- Request interceptor -----
    axiosInstance.interceptors.request.use(
      async (config: InternalAxiosRequestConfig): Promise<InternalAxiosRequestConfig> => {
        const ensureHeaders = () => {
          if (!config.headers) config.headers = new AxiosHeaders();
          return config.headers as AxiosHeaders | Record<string, any>;
        };
        const setAuth = (token: string) => {
          const h = ensureHeaders();
          if (typeof (h as any).set === "function") {
            (h as AxiosHeaders).set("Authorization", `Bearer ${token}`);
          } else {
            (config.headers as any) = { ...(config.headers as any), Authorization: `Bearer ${token}` };
          }
        };

        const isRefresh = isRefreshRequest(config);
        const token = getAccessToken();

        // 1️⃣ Gắn token hiện tại
        if (token && !isRefresh) setAuth(token);

        // 2️⃣ Nếu token sắp hết hạn → refresh nền (fire & forget)
        if (!isRefresh && !isRefreshing) {
          const remain = secondsUntilExpiry(token);
          if (remain !== null && remain <= EARLY_REFRESH_S) {
            void doRefreshOnce();
          }
        }

        // 3️⃣ Nếu đang refresh → pause tối đa 300ms
        if (isRefreshing && !isRefresh) {
          return new Promise<InternalAxiosRequestConfig>((resolve) => {
            let released = false;
            const timer = setTimeout(() => {
              if (released) return;
              released = true;
              resolve(config); // đi với token cũ, nếu 401 sẽ retry
            }, QUEUE_MAX_WAIT_MS);

            requestQueue.push((newToken) => {
              if (released) return;
              clearTimeout(timer);
              released = true;
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
      (res) => res,
      async (err) => {
        const originalRequest = err.config as AxiosRequestConfig & { _retry?: boolean };
        const status = err?.response?.status;

        if (status !== 401) return Promise.reject(err);

        if (isRefreshRequest(originalRequest)) {
          isRefreshing = false;
          refreshPromise = null;
          flushQueue(null);
          logoutOnce();
          return Promise.reject(err);
        }

        if (originalRequest._retry) {
          isRefreshing = false;
          refreshPromise = null;
          flushQueue(null);
          logoutOnce();
          return Promise.reject(err);
        }
        originalRequest._retry = true;

        const token = await doRefreshOnce();
        flushQueue(token);
        isRefreshing = false;
        refreshPromise = null;

        if (!token) {
          logoutOnce();
          return Promise.reject(err);
        }

        originalRequest.headers = originalRequest.headers ?? {};
        (originalRequest.headers as any).Authorization = `Bearer ${token}`;
        return axiosInstance(originalRequest);
      }
    );

    return new ApiClient(axiosInstance);
  }

  // ==============================
  // ✅ Wrapped HTTP Methods (with retry)
  // ==============================
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.withRetry(() => this.instance.get<T>(url, config));
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

  // ==============================
  // ♻️ Retry logic
  // ==============================
  private async withRetry<T>(
    requestFn: () => Promise<AxiosResponse<T>>,
    maxAttempts = 3,
    delayMs = 1000
  ): Promise<AxiosResponse<T>> {
    let attempt = 0;
    while (true) {
      try {
        const res = await requestFn();
        if (res.data && typeof res.data === "object" && (res.data as any).statusCode === 102) {
          throw new Error((res.data as any).statusMessage || "Service message");
        }
        return res;
      } catch (err: any) {
        attempt++;
        const retryable =
          err?.code === "ECONNABORTED" ||
          err?.message?.includes("timeout") ||
          (err?.response?.status >= 500 && err?.response?.status !== 501);

        if (!retryable || attempt >= maxAttempts) {
          console.error(`[Axios] Request failed after ${attempt} attempts`, err);
          throw err;
        }
        const jitter = Math.floor(Math.random() * 200);
        await new Promise((r) => setTimeout(r, delayMs + jitter));
      }
    }
  }
}

export const apiClient = ApiClient.create();
