import type { OrderItemModel, OrderItemUpsertModel } from "./order-item.model";

export interface OrderModel {
  id: number;
  code: string;
  name?: string | null;
  customFields?: Record<string, any> | null;
  latestOrderItemUpsert?: OrderItemUpsertModel | Record<string, any> | null;
  latestOrderItem?: OrderItemModel | Record<string, any> | null;
  createdAt: string;
  updatedAt: string;
}

export interface OrderUpsertModel {
  dto: OrderModel;
  collections?: (string | undefined)[];
}
