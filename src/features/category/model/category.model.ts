export interface CategoryModel {
  id: number;
  code: string;
  name?: string | null;
  active: boolean;
  collectionId?: number | null;
  customFields?: Record<string, any> | null;
  productIds?: number[] | null;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryUpsertModel {
  dto: CategoryModel;
  collections?: (string | undefined)[];
}
