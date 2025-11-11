export interface ClinicModel {
  id: number;
  name: string;
  address?: string;
  phoneNumber?: string;
  brief?: string;
  logo?: string;
  active: boolean;
  dentistIds?: number[];
  createdAt: string;
  updatedAt: string;
}
