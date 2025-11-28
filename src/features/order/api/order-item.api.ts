import { apiClient } from "@core/network/api-client";
import { useAuthStore } from "@store/auth-store";
import { mapper } from "@core/mapper/auto-mapper";
import type { OrderItemHistoricalModel } from "../model/order-item.model";

export async function historical(orderId: number, orderItemId?: number): Promise<OrderItemHistoricalModel[]> {
  const { departmentApiPath } = useAuthStore.getState();
  orderItemId = orderItemId ?? 0;
  const { data } = await apiClient.get<any[]>(`${departmentApiPath()}/order/${orderId}/historical/${orderItemId}/list`);
  const result = mapper.map<any[], OrderItemHistoricalModel[]>("Common", data, "dto_to_model");
  return result;
}
