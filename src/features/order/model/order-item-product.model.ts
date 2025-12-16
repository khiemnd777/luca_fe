export interface OrderItemProductModel {
  id: number;
  productCode?: string | null;
  productId?: number | null;
  orderItemId?: number | null;
  orderId?: number | null;
  quantity: number;
  retailPrice?: number | null;
}
