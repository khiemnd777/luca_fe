export interface ClinicModel {
  id: number;
  name: string;
  address?: string;
  phoneNumber?: string;
  brief?: string;
  logo?: string;
  active: boolean;
  dentistIds?: number[];
  customFields?: Record<string, any> | null;
  createdAt: string;
  updatedAt: string;
}
