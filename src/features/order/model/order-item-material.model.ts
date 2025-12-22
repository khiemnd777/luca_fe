export interface OrderItemMaterialModel {
  id: number;
  materialCode?: string | null;
  materialId?: number | null;
  orderItemId?: number | null;
  orderId?: number | null;
  quantity: number;
  retailPrice?: number | null;
  type?: string | null;
  status?: string | null;
}
