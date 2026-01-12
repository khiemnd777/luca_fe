export interface InProgressOrderModel {
  id: number;
  code?: string | null;
  codeLatest?: string | null;
  deliveryDate?: string | null;
  now?: string | null;
  totalPrice?: number | null;
  statusLatest?: string | null;
  priorityLatest?: string | null;
}
