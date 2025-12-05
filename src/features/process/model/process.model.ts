export interface ProcessModel {
  id: number;
  sectionId: number | null;
  sectionName?: string | null;
  code: string;
  name?: string | null;
  active: boolean;
  customFields?: Record<string, any> | null;
  createdAt: string;
  updatedAt: string;
}
