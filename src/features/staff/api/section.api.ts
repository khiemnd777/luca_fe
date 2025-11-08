import type { FetchTableOpts } from "@core/table/table.types";
import type { ListResult } from "@core/types/list-result";
import type { SectionModel } from "@features/staff/model/section.model";
import { apiClient } from "@core/network/api-client";
import { useAuthStore } from "@store/auth-store";
import { mapper } from "@core/mapper/auto-mapper";

export async function fetchSections(tableOpts: FetchTableOpts): Promise<ListResult<SectionModel>> {
  const { departmentApiPath } = useAuthStore.getState();
  const { data } = await apiClient.getTable<any[]>(`${departmentApiPath()}/section/list`, tableOpts);
  const result = mapper.map<any[], ListResult<SectionModel>>("Section", data, "dto_to_model");
  return result;
}

export async function fetchById(id: number): Promise<SectionModel> {
  const { departmentApiPath } = useAuthStore.getState();
  const { data } = await apiClient.get<any>(`${departmentApiPath()}/section/${id}`);
  const result = mapper.map<any, SectionModel>("Section", data, "dto_to_model");
  return result;
}

export async function create(model: SectionModel): Promise<void> {
  const { departmentApiPath } = useAuthStore.getState();
  await apiClient.post<any>(`${departmentApiPath()}/section`, model);
}

export async function update(model: SectionModel): Promise<void> {
  const { departmentApiPath } = useAuthStore.getState();
  await apiClient.put<any>(`${departmentApiPath()}/section/${model.id}`, model);
}

export async function remove(id: number): Promise<void> {
  const { departmentApiPath } = useAuthStore.getState();
  await apiClient.delete<any>(`${departmentApiPath()}/section/${id}`);
}
