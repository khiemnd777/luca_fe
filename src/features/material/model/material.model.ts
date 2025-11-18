export interface MaterialModel {
  id: number;
  code: string;
  name?: string | null;
  active: boolean;
  supplierIds?: number[];
  supplierNames?: string[];
  customFields?: Record<string, any> | null;
  createdAt: string;
  updatedAt: string;
}
