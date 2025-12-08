export interface SectionModel {
  id: number;
  name: string;
  code?: string;
  color?: string;
  customFields?: Record<string, any> | null;
  processIds?: number[] | null;
  processNames?: string | null;
  description: string;
  active: boolean;
}
