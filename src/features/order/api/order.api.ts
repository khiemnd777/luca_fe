import type { FetchTableOpts } from "@core/table/table.types";
import type { ListResult } from "@core/types/list-result";
import type { OrderModel, OrderUpsertModel } from "@features/order/model/order.model";
import { apiClient } from "@core/network/api-client";
import { useAuthStore } from "@store/auth-store";
import { mapper } from "@core/mapper/auto-mapper";
import type { SearchOpts, SearchResult } from "@core/types/search.types";

export async function table(tableOpts: FetchTableOpts): Promise<ListResult<OrderModel>> {
  const { departmentApiPath } = useAuthStore.getState();
  const { data } = await apiClient.getTable<any[]>(`${departmentApiPath()}/order/list`, tableOpts);
  const result = mapper.map<any[], ListResult<OrderModel>>("Order", data, "dto_to_model");
  return result;
}

export async function search(opts: SearchOpts): Promise<SearchResult<OrderModel>> {
  const { departmentApiPath } = useAuthStore.getState();
  const { data } = await apiClient.search<any[]>(`${departmentApiPath()}/order/search`, opts);
  const result = mapper.map<any[], SearchResult<OrderModel>>("Order", data, "dto_to_model");
  return result;
}

export async function id(id: number): Promise<OrderModel> {
  const { departmentApiPath } = useAuthStore.getState();
  id = id === undefined ? -1 : id;
  const { data } = await apiClient.get<any>(`${departmentApiPath()}/order/${id}`);
  const result = mapper.map<any, OrderModel>("Order", data, "dto_to_model");
  return result;
}

export async function getByOrderIdAndOrderItemId(orderId: number, orderItemId: number): Promise<OrderModel> {
  const { departmentApiPath } = useAuthStore.getState();
  const { data } = await apiClient.get<any>(`${departmentApiPath()}/order/${orderId}/historical/${orderItemId}`);
  const result = mapper.map<any, OrderModel>("Order", data, "dto_to_model");
  return result;
}

export async function create(model: OrderUpsertModel): Promise<void> {
  const { departmentApiPath } = useAuthStore.getState();
  await apiClient.post<any>(`${departmentApiPath()}/order`, model);
}

export async function update(model: OrderUpsertModel): Promise<void> {
  const { departmentApiPath } = useAuthStore.getState();
  await apiClient.put<any>(`${departmentApiPath()}/order/${model.dto.id}`, model);
}

export async function updateStatus(orderId: number, orderItemProcessId: number, status: string): Promise<OrderModel> {
  const { departmentApiPath } = useAuthStore.getState();
  const { data } = await apiClient.put<any>(`${departmentApiPath()}/order/${orderId}/process/${orderItemProcessId}/change-status/${status}`);
  const result = mapper.map<any, OrderModel>("Order", data, "dto_to_model");
  return result;
}

export async function unlink(id: number): Promise<void> {
  const { departmentApiPath } = useAuthStore.getState();
  await apiClient.delete<any>(`${departmentApiPath()}/order/${id}`);
}
