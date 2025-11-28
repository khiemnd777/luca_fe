import { apiClient } from "@core/network/api-client";
import { useAuthStore } from "@store/auth-store";
import { mapper } from "@core/mapper/auto-mapper";
import type { OrderItemProcessModel } from "../model/order-item-process.model";

export async function processes(orderId: number, orderItemId: number): Promise<OrderItemProcessModel[]> {
  const { departmentApiPath } = useAuthStore.getState();
  const { data } = await apiClient.get<any[]>(`${departmentApiPath()}/order/${orderId}/historical/${orderItemId}/processes`);
  const result = mapper.map<any[], OrderItemProcessModel[]>("Common", data, "dto_to_model");
  return result;
}
