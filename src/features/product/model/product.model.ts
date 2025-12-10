export interface ProductModel {
  id: number;
  code: string;
  name?: string | null;
  active: boolean;
  customFields?: Record<string, any> | null;
  processIds?: number[];
  processNames?: string;
  categoryId?: number | null;
  categoryName?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProductUpsertModel {
  dto: ProductModel;
  collections?: (string | undefined)[];
}