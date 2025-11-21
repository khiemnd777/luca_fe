export interface ProductModel {
  id: number;
  code: string;
  name?: string | null;
  active: boolean;
  customFields?: Record<string, any> | null;
  processIds?: number[];
  processNames?: string;
  createdAt: string;
  updatedAt: string;
}
