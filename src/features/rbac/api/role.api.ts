import type { RoleDto } from "@features/rbac/models/role.dto";
import { env } from "@core/config/env";
import { mapper } from "@core/mapper/auto-mapper";
import { apiClient } from "@core/network/api-client";
import type { ListResult } from "@core/types/list-result";


export async function fetchRoles(limit = 20, offset = 0): Promise<ListResult<RoleDto>> {
  const { data } = await apiClient.get<any[]>(`${env.apiBasePath}/rbac/roles`, {
    params: {
      limit,
      offset,
    },
  });
  const result = mapper.map<any[], ListResult<RoleDto>>("Role", data, "dto_to_model");
  return result;
}