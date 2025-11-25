export interface OrderModel {
  id: number;
  code: string;
  name?: string | null;
  active: boolean;
  customFields?: Record<string, any> | null;
  createdAt: string;
  updatedAt: string;
}

export interface OrderUpsertModel {
  dto: OrderModel;
  collections?: (string | undefined)[];
}
