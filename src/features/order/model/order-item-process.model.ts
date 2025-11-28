export interface OrderItemProcessModel {
  id?: number;
  orderItemId?: number;

  processName?: string | null;
  stepNumber?: number;

  startedAt?: string | null;
  completedAt?: string | null;

  note?: string | null;

  assignedId?: number | null;
  assignedName?: string | null;

  customFields?: Record<string, any>;
}
