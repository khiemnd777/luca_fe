import {
  ACCESS_KEY,
  getRefreshToken,
  REFRESH_KEY,
  saveAccessToken,
  saveRefreshToken,
} from "@core/network/token-utils";
import { apiClient } from "@core/network/api-client";
import type { AuthResponse, RefreshTokenResponse } from "@core/network/auth-types";
import { env } from "@root/core/config/env";

const baseURL = env.apiBasePath;

/**
 * Đăng nhập và lưu lại access/refresh token
 */
export async function login(
  email: string,
  password: string
): Promise<AuthResponse> {
  const res = await apiClient.post<AuthResponse>(
    `${baseURL}/auth/login`,
    { phone_or_email: email, password }
  );

  const data = res.data;
  saveAccessToken(data[ACCESS_KEY]);
  saveRefreshToken(data[REFRESH_KEY]);
  return data;
}

export async function logout(): Promise<void> {
  const refreshToken = getRefreshToken();
  await apiClient.post(`${baseURL}/auth/logout`, { refreshToken }).catch(() => {
    // tránh chặn flow logout vì lỗi mạng
  });
}

/**
 * Làm mới access token từ refresh token
 */
export async function refreshAccessToken(
  refreshToken: string | null
): Promise<string> {
  if (!refreshToken) throw new Error("No refresh token");

  const res = await apiClient.post<RefreshTokenResponse>(
    `${baseURL}/auth/refresh-token`,
    { refreshToken },
    { isRefresh: true },
  );

  const data = res.data;
  const newToken = data[ACCESS_KEY];
  saveAccessToken(newToken);
  return newToken;
}
