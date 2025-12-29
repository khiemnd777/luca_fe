import type { FetchTableOpts } from "@core/table/table.types";
import type { ListResult } from "@core/types/list-result";
import type { OrderModel, OrderUpsertModel } from "@features/order/model/order.model";
import { apiClient } from "@core/network/api-client";
import { useAuthStore } from "@store/auth-store";
import { mapper } from "@core/mapper/auto-mapper";
import type { SearchOpts, SearchResult } from "@core/types/search.types";
import type { OrderItemProductModel } from "../model/order-item-product.model";
import type { OrderItemMaterialModel } from "../model/order-item-material.model";

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

export async function getAllOrderProducts(orderId: number): Promise<OrderItemProductModel> {
  const { departmentApiPath } = useAuthStore.getState();
  const { data } = await apiClient.get<any>(`${departmentApiPath()}/order/${orderId}/products`);
  const result = mapper.map<any, OrderItemProductModel>("OrderItemProduct", data, "dto_to_model");
  return result;
}

export async function getAllOrderMaterials(orderId: number): Promise<OrderItemMaterialModel> {
  const { departmentApiPath } = useAuthStore.getState();
  const { data } = await apiClient.get<any>(`${departmentApiPath()}/order/${orderId}/materials`);
  const result = mapper.map<any, OrderItemMaterialModel>("OrderItemMaterial", data, "dto_to_model");
  return result;
}

type TotalPriceResponseDto = {
  total_price: number;
};

export async function syncPrice(orderId: number): Promise<number> {
  const { departmentApiPath } = useAuthStore.getState();
  const { data } = await apiClient.get<TotalPriceResponseDto>(`${departmentApiPath()}/order/${orderId}/sync-price`);
  return data.total_price;
}

export async function create(model: OrderUpsertModel): Promise<OrderModel> {
  const { departmentApiPath } = useAuthStore.getState();
  const { data } = await apiClient.post<any>(`${departmentApiPath()}/order`, model);
  const result = mapper.map<any, OrderModel>("Order", data, "dto_to_model");
  return result;
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
