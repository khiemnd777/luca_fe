export interface ClinicModel {
  id: number;
  name: string;
  address?: string;
  phoneNumber?: string;
  brief?: string;
  logo?: string;
  active: boolean;
  dentistIds?: number[];
  customeFields?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}
