
export interface StaffModel {
  id: number;
  name: string;
  password?: string;
  email: string;
  phone?: string;
  active?: boolean;
  avatar?: string;
  qrCode?: string;
  sectionIds?: number[];
  createdAt: string;
  updatedAt: string;
}
