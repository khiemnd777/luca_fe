import { apiClient } from "@core/network/api-client";
import { useAuthStore } from "@store/auth-store";
import { mapper } from "@core/mapper/auto-mapper";
import type { OrderItemProcessInProgressModel } from "../model/order-item-process-inprogress.model";
import type { OrderItemProcessModel, OrderItemProcessUpsertModel } from "../model/order-item-process.model";

export async function processes(orderId: number, orderItemId: number): Promise<OrderItemProcessModel[]> {
  const { departmentApiPath } = useAuthStore.getState();
  const { data } = await apiClient.get<any[]>(`${departmentApiPath()}/order/${orderId}/historical/${orderItemId}/processes`);
  const result = mapper.map<any[], OrderItemProcessModel[]>("OrderItemProcess", data, "dto_to_model");
  return result;
}

export async function processesForStaff(staffId: number): Promise<OrderItemProcessModel[]> {
  const { departmentApiPath } = useAuthStore.getState();
  const { data } = await apiClient.get<any[]>(`${departmentApiPath()}/staff/${staffId}/order/processes`);
  const result = mapper.map<any[], OrderItemProcessModel[]>("OrderItemProcess", data, "dto_to_model");
  return result;
}

export async function update(orderId: number, orderItemId: number, orderItemProcessId: number, payload: OrderItemProcessUpsertModel): Promise<OrderItemProcessModel[]> {
  const { departmentApiPath } = useAuthStore.getState();
  const { data } = await apiClient.put<any[]>(`${departmentApiPath()}/order/${orderId}/historical/${orderItemId}/processes/${orderItemProcessId}`, payload);
  const result = mapper.map<any[], OrderItemProcessModel[]>("OrderItemProcess", data, "dto_to_model");
  return result;
}

export async function prepareCheckInOrOut(orderId: number, orderItemId: number): Promise<OrderItemProcessInProgressModel> {
  const { departmentApiPath } = useAuthStore.getState();
  const { data } = await apiClient.get<any>(`${departmentApiPath()}/order/${orderId}/historical/${orderItemId}/processes/check-in-out/prepare`);
  const result = mapper.map<any, OrderItemProcessInProgressModel>("OrderItemProcessInProgress", data, "dto_to_model");
  return result;
}

export async function checkInOrOut(orderId: number, orderItemId: number, payload: OrderItemProcessUpsertModel): Promise<OrderItemProcessInProgressModel> {
  const { departmentApiPath } = useAuthStore.getState();
  const { data } = await apiClient.post<any>(`${departmentApiPath()}/order/${orderId}/historical/${orderItemId}/processes/check-in-out`, payload);
  const result = mapper.map<any, OrderItemProcessInProgressModel>("OrderItemProcessInProgress", data, "dto_to_model");
  return result;
}
