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

export async function fetchRoleByID(id: number): Promise<RoleModel> {
  const { data } = await apiClient.get<any>(`${env.apiBasePath}/rbac/roles/${id}`);
  const result = mapper.map<any, RoleModel>("Role", data, "dto_to_model");
  return result;
}

export async function createRole(model: RoleModel): Promise<void> {
  await apiClient.post<any>(`${env.apiBasePath}/rbac/roles`, model);
}

export async function updateRole(model: RoleModel): Promise<void> {
  await apiClient.put<any>(`${env.apiBasePath}/rbac/roles/${model.id}`, model);
}
