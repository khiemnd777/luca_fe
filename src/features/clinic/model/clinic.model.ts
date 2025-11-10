export interface ClinicModel {
  id: number;
  name: string;
  brief?: string;
  logo?: string;
  active: boolean;
  dentistIds?: number[];
  createdAt: string;
  updatedAt: string;
}
