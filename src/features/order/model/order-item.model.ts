export interface OrderItemModel {
  id: number;
  orderId: number;
  parentItemId: number;
  code: string;
  codeOriginal: string;
  remakeCount: number;
  customFields?: Record<string, any> | null;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItemUpsertModel {
  dto: OrderItemModel;
  collections?: (string | undefined)[];
}
