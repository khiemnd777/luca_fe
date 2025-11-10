export interface DentistModel {
  id: number;
  name: string;
  brief?: string;
  active: boolean;
  clinicIds?: number[];
  createdAt: string;
  updatedAt: string;
}
