export interface MaterialModel {
  id: number;
  code: string;
  name?: string | null;
  type?: string | null;
  active: boolean;
  supplierIds?: number[];
  supplierNames?: string;
  customFields?: Record<string, any> | null;
  retailPrice?: number | null;
  createdAt: string;
  updatedAt: string;
}
