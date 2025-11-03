import axios, { AxiosHeaders, type AxiosInstance, type AxiosRequestConfig, type AxiosResponse, type InternalAxiosRequestConfig } from "axios";
import { clearTokens, getAccessToken, getRefreshToken, saveAccessToken } from "@core/network/token-utils";
import { refreshAccessToken } from "@core/network/auth-api";

// ===== Global state (per tab) =====
let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;
let loggingOut = false;

// Hàng đợi các request bị tạm dừng trong lúc refresh.
// Mỗi item là hàm nhận token mới (có thể null) và resolve Promise ở request interceptor.
const requestQueue: Array<(token: string | null) => void> = [];

// ===== Optional: đa tab =====
const bc = typeof window !== "undefined" && "BroadcastChannel" in window ? new BroadcastChannel("auth") : null;

function broadcastToken(token: string | null) {
  try {
    bc?.postMessage(token ? { type: "token_refreshed", token } : { type: "logout" });
  } catch { }
}

function waitExternalRefresh(): Promise<string | null> {
  return new Promise((resolve) => {
    if (!bc) return resolve(null);
    const handler = (ev: MessageEvent) => {
      if (ev.data?.type === "token_refreshed") {
        bc.removeEventListener("message", handler);
        resolve(ev.data.token ?? null);
      }
      if (ev.data?.type === "logout") {
        bc.removeEventListener("message", handler);
        resolve(null);
      }
    };
    bc.addEventListener("message", handler);
    setTimeout(() => {
      try { bc?.removeEventListener("message", handler); } catch { }
      resolve(null);
    }, 8000);
  });
}

async function doRefreshOnce(): Promise<string | null> {
  if (refreshPromise) return refreshPromise;

  // BẮT ĐẦU single-flight ngay lập tức để chặn race
  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      // Nếu tab khác có thể đã refresh, thử nghe tín hiệu nhanh trước (nhưng không bỏ single-flight)
      const external = await waitExternalRefresh();
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
      // giữ isRefreshing đến khi flushQueue xong (được làm ở nơi gọi)
    }
  })();

  return refreshPromise;
}

function flushQueue(token: string | null) {
  // cấp token mới cho toàn bộ request đang đợi
  while (requestQueue.length) {
    const resume = requestQueue.shift()!;
    try { resume(token); } catch { }
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

    // ----- Request interceptor (PAUSE khi refresh) -----
    axiosInstance.interceptors.request.use(
      async (config: InternalAxiosRequestConfig): Promise<InternalAxiosRequestConfig> => {
        // helper: ensure headers exists
        const ensureHeaders = () => {
          if (!config.headers) config.headers = new AxiosHeaders();
          return config.headers as AxiosHeaders | Record<string, any>;
        };
        const setAuth = (token: string) => {
          const h = ensureHeaders();
          if (typeof (h as any).set === "function") {
            // AxiosHeaders instance
            (h as AxiosHeaders).set("Authorization", `Bearer ${token}`);
          } else {
            // plain object
            (config.headers as any) = { ...(config.headers as any), Authorization: `Bearer ${token}` };
          }
        };

        // Nếu đang refresh và request này không phải refresh → chờ
        if (isRefreshing && !isRefreshRequest(config)) {
          return new Promise<InternalAxiosRequestConfig>((resolve) => {
            requestQueue.push((newToken) => {
              if (newToken) setAuth(newToken);
              resolve(config); // TRẢ LẠI CHÍNH config (InternalAxiosRequestConfig)
            });
          });
        }

        // Bình thường gắn token hiện tại
        const token = getAccessToken();
        if (token && !isRefreshRequest(config)) {
          setAuth(token);
        }

        return config;
      }
    );

    // ----- Response interceptor (HANDLE 401) -----
    axiosInstance.interceptors.response.use(
      (res) => res,
      async (err) => {
        const originalRequest = err.config as AxiosRequestConfig & { _retry?: boolean };
        const status = err?.response?.status;

        if (status !== 401) {
          return Promise.reject(err);
        }

        // Nếu chính cuộc gọi refresh bị 401 → buộc logout
        if (isRefreshRequest(originalRequest)) {
          isRefreshing = false;
          refreshPromise = null;
          flushQueue(null);
          logoutOnce();
          return Promise.reject(err);
        }

        if (originalRequest._retry) {
          // tránh vòng lặp vô hạn
          isRefreshing = false;
          refreshPromise = null;
          flushQueue(null);
          logoutOnce();
          return Promise.reject(err);
        }
        originalRequest._retry = true;

        // Khởi động (hoặc dùng chung) refresh
        const token = await doRefreshOnce();

        // Kết thúc: phát hành hàng đợi trước khi clear cờ
        flushQueue(token);
        isRefreshing = false;
        refreshPromise = null;

        if (!token) {
          logoutOnce();
          return Promise.reject(err);
        }

        // Replay request ban đầu với token mới
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
