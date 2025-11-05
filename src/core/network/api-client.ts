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
let lastRefreshedAt = 0;          // mốc thời gian vừa refresh xong

// Hàng đợi các request bị tạm dừng trong lúc refresh
const requestQueue: Array<(token: string | null) => void> = [];

// ==============================
// ⚙️ Constants
// ==============================
const EARLY_REFRESH_S = 30;         // refresh sớm khi token còn < 30s
const BC_RACE_MS = 200;             // chờ broadcast tối đa 200ms
const QUEUE_MAX_WAIT_MS = 300;      // pause tối đa khi refresh
const LOGIN_PATH = "/login";
const LOGOUT_REDIRECT_GRACE_MS = 1500; // sau khi refresh, tạm thời KHÔNG redirect logout để tránh bounce

// ==============================
// ⚙️ Broadcast đa tab
// ==============================
const bc = typeof window !== "undefined" && "BroadcastChannel" in window ? new BroadcastChannel("auth") : null;
function broadcastToken(token: string | null) {
  try { bc?.postMessage(token ? { type: "token_refreshed", token } : { type: "logout" }); } catch { }
}

// ==============================
// ⚙️ Utils
// ==============================
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

export function isAuthRefreshing(): boolean {
  return isRefreshing;
}

// ✅ Export helper cho route guard
export function hasUsableAccessToken(): boolean {
  const t = getAccessToken();
  const exp = ((): number | null => {
    if (!t) return null;
    const p = t.split(".");
    if (p.length !== 3) return null;
    try {
      const payload = JSON.parse(atob(p[1].replace(/-/g, "+").replace(/_/g, "/")));
      return typeof payload?.exp === "number" ? payload.exp : null;
    } catch { return null; }
  })();
  if (!exp) return false;
  const now = Math.floor(Date.now() / 1000);
  return exp > now;
}

// ==============================
// 🧹 Bootstrap: dọn token hết hạn để tránh loop guard
// ==============================
(function bootstrapTokenSanity() {
  const t = getAccessToken();
  const remain = secondsUntilExpiry(t);
  if (t && (remain === null || remain <= 0)) {
    // ❌ đừng clearTokens() (sẽ xóa cả refresh token)
    // ✅ chỉ bỏ access token để các request sau đó kích refresh
    try { saveAccessToken(""); } catch { }
    // ❌ KHÔNG broadcast logout (vì phiên vẫn còn refresh token)
  }
})();

// ==============================
// ⚙️ Wait external refresh (race 200ms)
// ==============================
function waitExternalRefreshShort(): Promise<string | null> {
  return new Promise((resolve) => {
    if (!bc) return resolve(null);
    const timer = setTimeout(() => {
      try { bc.removeEventListener("message", handler); } catch { }
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
      // Nếu đang ở /login thì không race/refresh để tránh tự "đăng nhập lại" ngoài ý muốn
      if (isOnLogin()) return null;

      // Race: chờ token từ tab khác rất ngắn
      const external = await waitExternalRefreshShort();
      if (external) {
        saveAccessToken(external);
        lastRefreshedAt = Date.now();
        return external;
      }

      const rt = getRefreshToken();
      if (!rt) return null;

      const newToken = await refreshAccessToken(rt);
      if (newToken) {
        saveAccessToken(newToken);
        lastRefreshedAt = Date.now();
        broadcastToken(newToken);
        return newToken;
      }
      return null;
    } catch {
      return null;
    } finally {
      // clear tại nơi gọi sau flushQueue
    }
  })();

  return refreshPromise;
}

function flushQueue(token: string | null) {
  while (requestQueue.length) {
    const resume = requestQueue.shift()!;
    try { resume(token); } catch { }
  }
}

// 🔒 Soft logout: clear + broadcast, CHỈ redirect nếu an toàn
function softLogout() {
  if (loggingOut) return;
  loggingOut = true;
  try {
    clearTokens();
    broadcastToken(null);
  } finally {
    const justRefreshed = Date.now() - lastRefreshedAt < LOGOUT_REDIRECT_GRACE_MS;
    // Không redirect nếu: đang ở /login, hoặc vừa refresh xong (grace), để tránh bounce
    if (!isOnLogin() && !justRefreshed) {
      window.location.replace(LOGIN_PATH);
    }
    // Cho phép lần sau có thể logout lại nếu cần
    setTimeout(() => { loggingOut = false; }, 500);
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
          if (typeof (h as any).set === "function") (h as AxiosHeaders).set("Authorization", `Bearer ${token}`);
          else (config.headers as any) = { ...(config.headers as any), Authorization: `Bearer ${token}` };
        };

        const isRefresh = isRefreshRequest(config);
        const token = getAccessToken();
        const remain = secondsUntilExpiry(token);

        // Nếu token hết hạn/invalid → chỉ bỏ access token, KHÔNG đụng refresh token
        if (token && (remain === null || remain <= 0)) {
          try { saveAccessToken(""); } catch { }
          // ❌ KHÔNG broadcast logout — vẫn còn cơ hội refresh
        } else if (token && !isRefresh && remain !== null && remain > 0) {
          setAuth(token);
        }

        // Không kích refresh nền ở trang login
        if (!isOnLogin() && !isRefresh && !isRefreshing && remain !== null && remain <= EARLY_REFRESH_S && remain > 0) {
          void doRefreshOnce();
        }

        // Nếu đang refresh → pause tối đa rồi đi tiếp
        if (isRefreshing && !isRefresh) {
          return new Promise<InternalAxiosRequestConfig>((resolve) => {
            let released = false;
            const timer = setTimeout(() => {
              if (released) return;
              released = true;
              resolve(config); // đi tiếp; nếu 401 sẽ xử lý ở response
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
        const originalRequest = err.config as AxiosRequestConfig & { _retry?: boolean; __noAuthRedirect?: boolean };
        const status = err?.response?.status;

        // Cho phép tắt redirect cho một request cụ thể (nếu bạn muốn):
        const suppressRedirect = originalRequest?.__noAuthRedirect === true;

        if (status !== 401) return Promise.reject(err);

        // 401 của chính refresh → kết thúc phiên
        if (isRefreshRequest(originalRequest)) {
          isRefreshing = false;
          refreshPromise = null;
          flushQueue(null);
          if (!suppressRedirect) softLogout();
          return Promise.reject(err);
        }

        // Tránh vòng lặp vô hạn
        if (originalRequest._retry) {
          isRefreshing = false;
          refreshPromise = null;
          flushQueue(null);
          if (!suppressRedirect) softLogout();
          return Promise.reject(err);
        }
        originalRequest._retry = true;

        const token = await doRefreshOnce();
        flushQueue(token);
        isRefreshing = false;
        refreshPromise = null;

        if (!token) {
          // if (!suppressRedirect) softLogout();
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

        const status = err?.response?.status as number | undefined;
        const isAuthError = status === 401 || status === 403;

        const retryable =
          err?.code === "ECONNABORTED" ||
          err?.message?.includes("timeout") ||
          (typeof status === "number" && status >= 500 && status !== 501);

        if (!retryable || attempt >= maxAttempts) {
          // 🔇 Đừng spam console khi là lỗi auth (401/403) — guard/redirect sẽ xử lý
          if (!isAuthError) {
            console.error(`[Axios] Request failed after ${attempt} attempts`, err);
          }
          throw err;
        }

        const jitter = Math.floor(Math.random() * 200);
        await new Promise((r) => setTimeout(r, delayMs + jitter));
      }
    }
  }
}

export const apiClient = ApiClient.create();
