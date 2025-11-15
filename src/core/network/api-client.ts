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
import { mapper } from "@core/mapper/auto-mapper";
import { getIdemKeyFor } from "@core/network/api-client.utils";
import type { SearchOpts } from "../types/search.types";

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
 *  Auth constants
 *  ========================= */
const EARLY_REFRESH_S = 30;
const BC_RACE_MS = 200;
const REFRESH_HARD_TIMEOUT_MS = 6000;
const LOGIN_PATH = "/login";

/** =========================
 *  Broadcast đa tab (Auth)
 *  ========================= */
const authBC =
  typeof window !== "undefined" && "BroadcastChannel" in window
    ? new BroadcastChannel("auth")
    : null;

function broadcastAuth(
  type: "token_refreshed" | "logout" | "refresh_failed",
  token?: string | null,
) {
  try {
    authBC?.postMessage(
      type === "token_refreshed" ? { type, token } : { type },
    );
  } catch {
    // ignore
  }
}

/** =========================
 *  Auth utils
 *  ========================= */
function isOnLogin(): boolean {
  try {
    return (
      typeof window !== "undefined" &&
      window.location?.pathname?.startsWith(LOGIN_PATH)
    );
  } catch {
    return false;
  }
}

function getTokenExpSec(token?: string | null): number | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  try {
    const payload = JSON.parse(
      atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")),
    );
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

export function isAuthRefreshing(): boolean {
  return isRefreshing;
}

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
  broadcastAuth("refresh_failed");
}

function clearRefreshFailFlag() {
  lastRefreshFailedAt = null;
}

/** =========================
 *  Bootstrap: dọn accessToken hết hạn
 *  ========================= */
(function bootstrapTokenSanity() {
  const t = getAccessToken();
  const remain = secondsUntilExpiry(t);
  if (t && (remain === null || remain <= 0)) {
    try {
      saveAccessToken("");
    } catch {
      // ignore
    }
  }
})();

/** =========================
 *  Queue helpers cho request chờ refresh
 *  ========================= */
function flushQueue(newToken: string | null) {
  while (requestQueue.length) {
    const fn = requestQueue.shift()!;
    try {
      fn(newToken);
    } catch {
      // ignore
    }
  }
}

function failQueue() {
  while (requestQueue.length) {
    const fn = requestQueue.shift()!;
    try {
      fn(null);
    } catch {
      // ignore
    }
  }
}

/** =========================
 *  Timeout wrapper
 *  ========================= */
function withTimeout<T>(p: Promise<T>, ms: number): Promise<T | "__TIMEOUT__"> {
  return Promise.race([
    p,
    new Promise<"__TIMEOUT__">((res) =>
      setTimeout(() => res("__TIMEOUT__"), ms),
    ),
  ]);
}

/** =========================
 *  Race short từ tab khác (Auth)
 *  ========================= */
function waitExternalRefreshShort(): Promise<string | null> {
  return new Promise((resolve) => {
    if (!authBC) return resolve(null);

    const timer = setTimeout(() => {
      try {
        authBC.removeEventListener("message", handler);
      } catch {
        // ignore
      }
      resolve(null);
    }, BC_RACE_MS);

    const handler = (ev: MessageEvent) => {
      if (ev.data?.type === "token_refreshed") {
        clearTimeout(timer);
        authBC.removeEventListener("message", handler);
        resolve(ev.data.token ?? null);
      }
      if (ev.data?.type === "logout" || ev.data?.type === "refresh_failed") {
        clearTimeout(timer);
        authBC.removeEventListener("message", handler);
        resolve(null);
      }
    };

    authBC.addEventListener("message", handler);
  });
}

function isRefreshRequest(config?: AxiosRequestConfig | null) {
  const url = config?.url ?? "";
  return url.includes("/auth/refresh") || url.includes("/refresh-token");
}

/** =========================
 *  Refresh logic (single-flight + đa tab)
 *  ========================= */
async function doRefreshOnce(): Promise<string | null> {
  if (refreshPromise) return refreshPromise;

  isRefreshing = true;

  const core = (async () => {
    try {
      if (isOnLogin()) return null;

      // Race ngắn với tab khác
      const external = await waitExternalRefreshShort();
      if (external) {
        saveAccessToken(external);
        clearRefreshFailFlag();
        return external;
      }

      const rt = getRefreshToken();
      if (!rt) return null;

      const newToken = await refreshAccessToken(rt);
      if (newToken) {
        saveAccessToken(newToken);
        broadcastAuth("token_refreshed", newToken);
        clearRefreshFailFlag();
        return newToken;
      }
      return null;
    } catch {
      return null;
    }
  })();

  const raced = withTimeout(core, REFRESH_HARD_TIMEOUT_MS).then((r) =>
    r === "__TIMEOUT__" ? null : r,
  );
  refreshPromise = raced;

  raced
    .then((token) => {
      isRefreshing = false;
      refreshPromise = null;
      if (token) {
        flushQueue(token);
      } else {
        markRefreshFail();
        failQueue();
      }
    })
    .catch(() => {
      isRefreshing = false;
      refreshPromise = null;
      markRefreshFail();
      failQueue();
    });

  return raced;
}

/** =========================
 *  Response cache (memory + localStorage, đa tab)
 *  ========================= */

const CACHE_PREFIX = "__api_resp_v1__";
const DEFAULT_CACHE_TTL_MS = 30_000;

type CacheMode = "off" | "cache-first" | "stale-while-revalidate";

type StoredCacheEntry = {
  data: any;
  status: number;
  statusText: string;
  headers: Record<string, any>;
  expiresAt: number;
};

// per-tab memory cache
const MEMORY_CACHE = new Map<string, StoredCacheEntry>();

function nowMs() {
  return Date.now();
}

function safeLocalStorageGet(key: string): StoredCacheEntry | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(`${CACHE_PREFIX}:${key}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredCacheEntry;
    if (!parsed || typeof parsed.expiresAt !== "number") return null;
    return parsed;
  } catch {
    return null;
  }
}

function safeLocalStorageSet(key: string, value: StoredCacheEntry) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      `${CACHE_PREFIX}:${key}`,
      JSON.stringify(value),
    );
  } catch {
    // quota exceeded / private mode -> ignore
  }
}

function safeLocalStorageRemove(key: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(`${CACHE_PREFIX}:${key}`);
  } catch {
    // ignore
  }
}

// Stable stringify dùng chung cho dedup + cache
function stableStringify(input: any): string {
  if (input === null || typeof input !== "object") return JSON.stringify(input);
  if (Array.isArray(input)) {
    return `[${input.map((x) => stableStringify(x)).join(",")}]`;
  }
  const keys = Object.keys(input).sort();
  const obj = input as Record<string, any>;
  return `{${keys
    .map((k) => JSON.stringify(k) + ":" + stableStringify(obj[k]))
    .join(",")}}`;
}

function buildCacheKey(
  method: string,
  url: string,
  parts: Record<string, any>,
): string {
  const stable = stableStringify(parts ?? {});
  return `${method.toUpperCase()} ${url} :: ${stable}`;
}

function getCachedResponse<T>(key: string): AxiosResponse<T> | null {
  const now = nowMs();

  let entry = MEMORY_CACHE.get(key);
  if (!entry) {
    entry = safeLocalStorageGet(key) ?? undefined;
    if (entry) MEMORY_CACHE.set(key, entry);
  }

  if (!entry) return null;
  if (entry.expiresAt <= now) {
    MEMORY_CACHE.delete(key);
    safeLocalStorageRemove(key);
    return null;
  }

  const resp: AxiosResponse<T> = {
    data: entry.data as T,
    status: entry.status,
    statusText: entry.statusText,
    headers: entry.headers,
    config: {} as any,
    request: undefined,
  };
  return resp;
}

/** =========================
 *  Tag index & invalidate (tags + prefix)
 *  ========================= */

const TAG_INDEX_PREFIX = "__tags__";

function tagIndexKey(tag: string) {
  return `${CACHE_PREFIX}:${TAG_INDEX_PREFIX}:${tag}`;
}

function getTagKeys(tag: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(tagIndexKey(tag));
    if (!raw) return [];
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr as string[];
  } catch {
    return [];
  }
}

function setTagKeys(tag: string, keys: string[]) {
  if (typeof window === "undefined") return;
  try {
    const deduped = Array.from(new Set(keys));
    if (deduped.length === 0) {
      window.localStorage.removeItem(tagIndexKey(tag));
    } else {
      window.localStorage.setItem(tagIndexKey(tag), JSON.stringify(deduped));
    }
  } catch {
    // ignore
  }
}

function addTagsForKey(cacheKey: string, tags?: string[]) {
  if (!tags || tags.length === 0) return;
  for (const tag of tags) {
    const keys = getTagKeys(tag);
    keys.push(cacheKey);
    setTagKeys(tag, keys);
  }
}

function setCachedResponse<T>(
  key: string,
  res: AxiosResponse<T>,
  ttlMs: number,
  tags?: string[],
) {
  const entry: StoredCacheEntry = {
    data: res.data,
    status: res.status,
    statusText: res.statusText,
    headers: res.headers as any,
    expiresAt: nowMs() + ttlMs,
  };
  MEMORY_CACHE.set(key, entry);
  safeLocalStorageSet(key, entry);
  addTagsForKey(key, tags);
}

/** =========================
 *  Broadcast đa tab (CACHE)
 *  ========================= */

const CACHE_BC_NAME = "__api_cache_channel__";

type CacheInvalidateMessage = {
  type: "invalidate";
  tags?: string[];
  tagPrefixes?: string[];
};

type InvalidateOptions = {
  tags?: string[];
  tagPrefixes?: string[];
  broadcast: boolean;
};

let cacheChannel: BroadcastChannel | null = null;

if (typeof window !== "undefined" && "BroadcastChannel" in window) {
  cacheChannel = new BroadcastChannel(CACHE_BC_NAME);
  cacheChannel.onmessage = (ev) => {
    const msg = ev.data as CacheInvalidateMessage;
    if (!msg || msg.type !== "invalidate") return;
    invalidateCacheInternal({
      tags: msg.tags,
      tagPrefixes: msg.tagPrefixes,
      broadcast: false, // tránh loop
    });
  };
}

function broadcastInvalidate(opts: InvalidateOptions) {
  if (!cacheChannel) return;
  const payload: CacheInvalidateMessage = {
    type: "invalidate",
    tags: opts.tags,
    tagPrefixes: opts.tagPrefixes,
  };
  cacheChannel.postMessage(payload);
}

function invalidateSingleTag(tag: string) {
  const keys = getTagKeys(tag);
  if (!keys || keys.length === 0) {
    setTagKeys(tag, []);
    return;
  }

  for (const key of keys) {
    MEMORY_CACHE.delete(key);
    safeLocalStorageRemove(key);
  }

  setTagKeys(tag, []);
}

function invalidateCacheInternal(opts: InvalidateOptions) {
  const tags = Array.from(new Set(opts.tags ?? []));
  const prefixes = Array.from(new Set(opts.tagPrefixes ?? []));

  // 1. Exact tags
  for (const tag of tags) {
    invalidateSingleTag(tag);
  }

  // 2. Prefix
  if (prefixes.length > 0 && typeof window !== "undefined") {
    const prefixBase = `${CACHE_PREFIX}:${TAG_INDEX_PREFIX}:`;
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (!key || !key.startsWith(prefixBase)) continue;

      const tag = key.slice(prefixBase.length);
      if (prefixes.some((p) => tag.startsWith(p))) {
        invalidateSingleTag(tag);
      }
    }
  }

  if (opts.broadcast) {
    broadcastInvalidate({ tags, tagPrefixes: prefixes, broadcast: false });
  }
}

function invalidateCacheByTags(tags: string[]) {
  if (!tags || tags.length === 0) return;
  invalidateCacheInternal({ tags, tagPrefixes: [], broadcast: true });
}

function invalidateCacheByTagPrefixes(prefixes: string[]) {
  if (!prefixes || prefixes.length === 0) return;
  invalidateCacheInternal({ tags: [], tagPrefixes: prefixes, broadcast: true });
}

/** Optional public helper nếu muốn dùng ngoài ApiClient */
export function invalidateApiCache(tags?: string[], prefixes?: string[]) {
  if (tags && tags.length) invalidateCacheByTags(tags);
  if (prefixes && prefixes.length) invalidateCacheByTagPrefixes(prefixes);
}

/** =========================
 *  ApiClient (singleton)
 *  ========================= */

type DedupConfig = AxiosRequestConfig & {
  dedupKey?: string | false;

  // cache
  cacheMode?: CacheMode;
  cacheKey?: string;
  cacheTTL?: number;
  cacheTags?: string[];

  // invalidate
  invalidateTags?: string[];
  invalidateTagPrefixes?: string[];
};

export class ApiClient {
  private readonly instance: AxiosInstance;
  private constructor(axiosInstance: AxiosInstance) {
    this.instance = axiosInstance;
  }

  private inflight = new Map<string, Promise<AxiosResponse<any>>>();

  static create(): ApiClient {
    // Singleton thật sự (chống HMR/dev tạo nhiều instance gây flicker do request lặp)
    if (globalThis.__API_CLIENT_SINGLETON__)
      return globalThis.__API_CLIENT_SINGLETON__;

    const axiosInstance = axios.create({
      baseURL: "",
      headers: { "Content-Type": "application/json" },
      timeout: 10000,
    });

    // ----- Request interceptor (DUY NHẤT) -----
    axiosInstance.interceptors.request.use(
      async (
        config: InternalAxiosRequestConfig,
      ): Promise<InternalAxiosRequestConfig> => {
        const ensureHeaders = () => {
          if (!config.headers) config.headers = new AxiosHeaders();
          return config.headers as AxiosHeaders | Record<string, any>;
        };
        const setAuth = (token: string) => {
          const h = ensureHeaders();
          if (typeof (h as any).set === "function")
            (h as AxiosHeaders).set("Authorization", `Bearer ${token}`);
          else
            (config.headers as any) = {
              ...(config.headers as any),
              Authorization: `Bearer ${token}`,
            };
        };

        const isRefresh = isRefreshRequest(config);
        const at = getAccessToken();
        const remain = secondsUntilExpiry(at);

        // Dọn accessToken hết hạn
        if (at && (remain === null || remain <= 0)) {
          try {
            saveAccessToken("");
          } catch {
            // ignore
          }
        }

        // Token còn hạn, attach luôn
        if (at && remain !== null && remain > 0 && !isRefresh) {
          setAuth(at);
          // gần hết hạn thì kick off refresh nền
          if (remain <= EARLY_REFRESH_S && !isRefreshing && !isOnLogin())
            void doRefreshOnce();
          return config;
        }

        // Không phải request refresh + có refresh token -> chờ refresh
        if (!isRefresh && getRefreshToken()) {
          if (!isRefreshing) void doRefreshOnce();
          return new Promise<InternalAxiosRequestConfig>((resolve) => {
            requestQueue.push((newToken) => {
              if (newToken) setAuth(newToken);
              resolve(config);
            });
          });
        }

        // Gắn Idempotency-Key cho POST/PUT/DELETE
        const method = (config.method ?? "get").toUpperCase();
        if (method === "POST" || method === "PUT" || method === "DELETE") {
          const key = getIdemKeyFor(config);
          config.headers = config.headers ?? {};
          (config.headers as any)["Idempotency-Key"] = key;
        }

        return config;
      },
    );

    // ----- Response interceptor -----
    axiosInstance.interceptors.response.use(
      (response) => response,
      async (error) => {
        const original: InternalAxiosRequestConfig & { _retry?: boolean } =
          error?.config ?? {};
        const status = error?.response?.status as number | undefined;

        if (
          (status === 401 || status === 403) &&
          !original._retry &&
          !isRefreshRequest(original) &&
          getRefreshToken()
        ) {
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
      },
    );

    const client = new ApiClient(axiosInstance);
    globalThis.__API_CLIENT_SINGLETON__ = client;
    return client;
  }

  /** =========================
   *  Wrapped HTTP (dedup + retry + cache)
   *  ========================= */

  async get<T>(
    url: string,
    config?: DedupConfig,
  ): Promise<AxiosResponse<T>> {
    const exec = () => this.instance.get<T>(url, config);
    return this.requestWithDedup<T>(
      "GET",
      url,
      exec,
      { params: config?.params },
      config,
    );
  }

  async getTable<T>(
    url: string,
    tableOpts: FetchTableOpts,
    config?: DedupConfig,
  ): Promise<AxiosResponse<T>> {
    const tableOptsDto = mapper.map<FetchTableOpts, any>(
      "TableOpts",
      tableOpts,
      "model_to_dto",
    );
    const cfg = { params: tableOptsDto, ...config };
    const exec = () => this.instance.get<T>(url, cfg);
    return this.requestWithDedup<T>(
      "GET",
      url,
      exec,
      { params: tableOptsDto },
      cfg,
    );
  }

  async search<T>(
    url: string,
    opts: SearchOpts,
    config?: DedupConfig,
  ): Promise<AxiosResponse<T>> {
    const dto = mapper.map<SearchOpts, any>(
      "SearchOpts",
      opts,
      "model_to_dto",
    );
    const cfg = { params: dto, ...config };
    const exec = () => this.instance.get<T>(url, cfg);
    return this.requestWithDedup<T>("GET", url, exec, { params: dto }, cfg);
  }

  async post<T>(
    url: string,
    data?: any,
    config?: DedupConfig,
  ): Promise<AxiosResponse<T>> {
    const exec = () => this.instance.post<T>(url, data, config);
    const res = await this.requestWithDedup<T>(
      "POST",
      url,
      exec,
      { data, params: config?.params },
      config,
    );

    if (config) {
      if (config.invalidateTags?.length)
        invalidateCacheByTags(config.invalidateTags);
      if (config.invalidateTagPrefixes?.length)
        invalidateCacheByTagPrefixes(config.invalidateTagPrefixes);
    }

    return res;
  }

  async put<T>(
    url: string,
    data?: any,
    config?: DedupConfig,
  ): Promise<AxiosResponse<T>> {
    const exec = () => this.instance.put<T>(url, data, config);
    const res = await this.requestWithDedup<T>(
      "PUT",
      url,
      exec,
      { data, params: config?.params },
      config,
    );

    if (config) {
      if (config.invalidateTags?.length)
        invalidateCacheByTags(config.invalidateTags);
      if (config.invalidateTagPrefixes?.length)
        invalidateCacheByTagPrefixes(config.invalidateTagPrefixes);
    }

    return res;
  }

  async delete<T>(
    url: string,
    config?: DedupConfig,
  ): Promise<AxiosResponse<T>> {
    const exec = () => this.instance.delete<T>(url, config);
    const res = await this.requestWithDedup<T>(
      "DELETE",
      url,
      exec,
      { data: (config as any)?.data, params: config?.params },
      config,
    );

    if (config) {
      if (config.invalidateTags?.length)
        invalidateCacheByTags(config.invalidateTags);
      if (config.invalidateTagPrefixes?.length)
        invalidateCacheByTagPrefixes(config.invalidateTagPrefixes);
    }

    return res;
  }

  /** =========================
   *  Dedup + retry + cache core
   *  ========================= */

  private async requestWithDedup<T>(
    method: string,
    url: string,
    factory: () => Promise<AxiosResponse<T>>,
    keyParts: Record<string, any>,
    config?: DedupConfig,
  ): Promise<AxiosResponse<T>> {
    const upperMethod = method.toUpperCase();
    const dedupKey = config?.dedupKey;

    const cacheMode: CacheMode = config?.cacheMode ?? "off";
    const cacheTTL = config?.cacheTTL ?? DEFAULT_CACHE_TTL_MS;

    const isGet = upperMethod === "GET";
    const cacheEnabled = isGet && cacheMode !== "off";

    const cacheKey =
      config?.cacheKey ?? buildCacheKey(upperMethod, url, keyParts);

    // 1) cache-first / stale-while-revalidate -> đọc cache trước
    if (
      cacheEnabled &&
      (cacheMode === "cache-first" || cacheMode === "stale-while-revalidate")
    ) {
      const cached = getCachedResponse<T>(cacheKey);
      if (cached) {
        if (cacheMode === "stale-while-revalidate") {
          // Refresh nền
          void (async () => {
            try {
              const fresh = await this.runWithDedupAndRetry<T>(
                upperMethod,
                url,
                factory,
                keyParts,
                dedupKey,
              );
              if (fresh.status >= 200 && fresh.status < 400) {
                setCachedResponse(
                  cacheKey,
                  fresh,
                  cacheTTL,
                  config?.cacheTags,
                );
              }
            } catch {
              // ignore background error
            }
          })();
        }
        return cached;
      }
    }

    // 2) gọi network (dedup + retry)
    const res = await this.runWithDedupAndRetry<T>(
      upperMethod,
      url,
      factory,
      keyParts,
      dedupKey,
    );

    // 3) lưu cache
    if (cacheEnabled && res.status >= 200 && res.status < 400) {
      setCachedResponse(cacheKey, res, cacheTTL, config?.cacheTags);
    }

    return res;
  }

  private async runWithDedupAndRetry<T>(
    method: string,
    url: string,
    factory: () => Promise<AxiosResponse<T>>,
    keyParts: Record<string, any>,
    dedupKey?: string | false,
  ): Promise<AxiosResponse<T>> {
    // Cho phép tắt dedup hoặc đặt key tùy chỉnh
    const key =
      dedupKey === false
        ? null
        : dedupKey || this.buildDedupKey(method, url, keyParts);

    if (!key) {
      return this.withRetry(factory);
    }

    const existed = this.inflight.get(key);
    if (existed) return existed as Promise<AxiosResponse<T>>;

    const p = this.withRetry(factory).finally(() => {
      this.inflight.delete(key);
    }) as Promise<AxiosResponse<T>>;

    this.inflight.set(key, p);
    return p;
  }

  private buildDedupKey(
    method: string,
    url: string,
    parts: Record<string, any>,
  ): string {
    const stable = stableStringify(parts ?? {});
    return `${method.toUpperCase()} ${url} :: ${stable}`;
  }

  private async withRetry<T>(
    requestFn: () => Promise<AxiosResponse<T>>,
    maxAttempts = 3,
    delayMs = 1000,
  ): Promise<AxiosResponse<T>> {
    let attempt = 0;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      try {
        const res = await requestFn();
        // Logic đặc biệt: backend trả statusCode=102 trong body → coi như lỗi
        if (
          res.data &&
          typeof res.data === "object" &&
          (res.data as any).statusCode === 102
        ) {
          throw new Error(
            (res.data as any).statusMessage || "Service message",
          );
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
          if (!isAuthError)
            console.error(
              `[Axios] Request failed after ${attempt} attempts`,
              err,
            );
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
