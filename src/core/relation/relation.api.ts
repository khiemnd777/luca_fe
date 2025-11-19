import { useAuthStore } from "@store/auth-store";
import type { FetchTableOpts } from "../table/table.types";
import type { ListResult } from "../types/list-result";
import { apiClient } from "../network/api-client";
import { mapper } from "../mapper/auto-mapper";

export async function rel<T>(key: string, mainId: number, tableOpts: FetchTableOpts): Promise<ListResult<T>> {
  const { departmentApiPath } = useAuthStore.getState();
  mainId = mainId === undefined ? -1 : mainId;
  const { data } = await apiClient.getTable<any[]>(`${departmentApiPath()}/relation/${key}/${mainId}/list`, tableOpts);
  const result = mapper.map<any[], ListResult<T>>("Common", data, "dto_to_model");
  return result;
}