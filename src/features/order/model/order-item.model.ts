export interface OrderItemModel {
  // general
  id: number;
  orderId: number;
  parentItemId: number;
  customFields?: Record<string, any> | null;
  createdAt: string;
  updatedAt: string;
  // order
  code: string;
  codeOriginal: string;
  remakeCount: number;
  // product
  productId?: number | null;
  productName?: string;
}

export interface OrderItemUpsertModel {
  dto: OrderItemModel;
  collections?: (string | undefined)[];
}

export interface OrderItemHistoricalModel {
  id: number;
  code: string;
  createdAt: string;
  isCurrent: boolean;
  isHighlight: boolean;
}
