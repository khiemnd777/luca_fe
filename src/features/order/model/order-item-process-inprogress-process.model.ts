export interface OrderItemProcessInProgressProcessModel {
  id?: number;
  orderItemId?: number | null;
  orderId?: number | null;
  checkInNote?: string | null;
  checkOutNote?: string | null;
  assignedId?: number | null;
  assignedName?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  processName?: string | null;
  sectionName?: string | null;
  color?: string | null;
}
