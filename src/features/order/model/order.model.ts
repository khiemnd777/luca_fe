import type { OrderItemModel, OrderItemUpsertModel } from "./order-item.model";

export interface OrderModel {
  id: number;
  code: string;
  customFields?: Record<string, any> | null;
  latestOrderItemUpsert?: OrderItemUpsertModel | Record<string, any> | null;
  latestOrderItem?: OrderItemModel | Record<string, any> | null;
  customerName?: string;
  statusLatest?: string;
  codeLatest?: string;
  priorityLatest?: string;
  productId?: number;
	productName?: string;
	quantity?: number;
	totalPrice?: number;
  deliveryDate?: string | null;
  remakeType?: string;
  remakeCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface OrderUpsertModel {
  dto: OrderModel;
  collections?: (string | undefined)[];
}
