import { apiClient } from "@core/network/api-client";
import type { MeDto } from "@core/network/me-types";
import { env } from "@core/config/env";
import { mapper } from "@core/mapper/auto-mapper";

export async function fetchMe(): Promise<MeDto> {
  const { data } = await apiClient.get<any>(`${env.apiBasePath}/profile/me`);
  const result = mapper.map<any, MeDto>("Me", data, "dto_to_model");
  return result;
}
