import type { FetchTableOpts } from "@core/table/table.types";
import type { ListResult } from "@core/types/list-result";
import type { ProductModel, ProductUpsertModel } from "@features/product/model/product.model";
import { apiClient } from "@core/network/api-client";
import { useAuthStore } from "@store/auth-store";
import { mapper } from "@core/mapper/auto-mapper";
import type { SearchOpts, SearchResult } from "@core/types/search.types";

export async function table(tableOpts: FetchTableOpts): Promise<ListResult<ProductModel>> {
  const { departmentApiPath } = useAuthStore.getState();
  const { data } = await apiClient.getTable<any[]>(`${departmentApiPath()}/product/list`, tableOpts);
  const result = mapper.map<any[], ListResult<ProductModel>>("Product", data, "dto_to_model");
  return result;
}

export async function variantTable(productId: number, tableOpts: FetchTableOpts): Promise<ListResult<ProductModel>> {
  const { departmentApiPath } = useAuthStore.getState();
  const { data } = await apiClient.getTable<any[]>(`${departmentApiPath()}/product/${productId}/variant`, tableOpts);
  const result = mapper.map<any[], ListResult<ProductModel>>("Product", data, "dto_to_model");
  return result;
}

export async function search(opts: SearchOpts): Promise<SearchResult<ProductModel>> {
  const { departmentApiPath } = useAuthStore.getState();
  const { data } = await apiClient.search<any[]>(`${departmentApiPath()}/product/search`, opts);
  const result = mapper.map<any[], SearchResult<ProductModel>>("Product", data, "dto_to_model");
  return result;
}

export async function id(id: number): Promise<ProductModel> {
  const { departmentApiPath } = useAuthStore.getState();
  id = id === undefined ? -1 : id;
  const { data } = await apiClient.get<any>(`${departmentApiPath()}/product/${id}`);
  const result = mapper.map<any, ProductModel>("Product", data, "dto_to_model");
  return result;
}

export async function create(model: ProductUpsertModel): Promise<void> {
  const { departmentApiPath } = useAuthStore.getState();
  await apiClient.post<any>(`${departmentApiPath()}/product`, model);
}

export async function update(model: ProductUpsertModel): Promise<void> {
  const { departmentApiPath } = useAuthStore.getState();
  await apiClient.put<any>(`${departmentApiPath()}/product/${model.dto.id}`, model);
}

export async function unlink(id: number): Promise<void> {
  const { departmentApiPath } = useAuthStore.getState();
  await apiClient.delete<any>(`${departmentApiPath()}/product/${id}`);
}
