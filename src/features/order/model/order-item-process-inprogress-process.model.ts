export interface OrderItemProcessInProgressProcessModel {
  id?: number;
  note?: string | null;
  assignedId?: number | null;
  assignedName?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  processName?: string | null;
  sectionName?: string | null;
  color?: string | null;
}
