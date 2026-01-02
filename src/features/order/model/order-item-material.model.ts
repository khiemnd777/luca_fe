export interface OrderItemMaterialModel {
  id: number;
  materialCode?: string | null;
  materialName?: string | null;
  materialId?: number | null;
  orderItemId?: number | null;
  orderItemCode?: string | null;
  orderId?: number | null;
  quantity: number;
  retailPrice?: number | null;
  type?: string | null;
  status?: string | null;
  isCloneable?: boolean | null;
}
