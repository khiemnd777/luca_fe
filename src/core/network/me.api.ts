import { apiClient } from "@core/network/api-client";
import type { MeModel } from "@root/core/auth/auth.types";
import { env } from "@core/config/env";
import { mapper } from "@core/mapper/auto-mapper";

export async function fetchMe(): Promise<MeModel> {
  const { data } = await apiClient.get<any>(`${env.apiBasePath}/profile/me`);
  const result = mapper.map<any, MeModel>("Me", data, "dto_to_model");
  return result;
}
