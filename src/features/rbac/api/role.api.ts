import type { RoleModel } from "@root/features/rbac/model/role.model";
import { env } from "@core/config/env";
import { mapper } from "@core/mapper/auto-mapper";
import { apiClient } from "@core/network/api-client";
import type { ListResult } from "@core/types/list-result";
import type { FetchTableOpts } from "@root/core/table/table.types";


export async function fetchRoles(tableOpts: FetchTableOpts): Promise<ListResult<RoleModel>> {
  const { data } = await apiClient.getTable<any[]>(`${env.apiBasePath}/rbac/roles`, tableOpts);
  const result = mapper.map<any[], ListResult<RoleModel>>("Role", data, "dto_to_model");
  return result;
}