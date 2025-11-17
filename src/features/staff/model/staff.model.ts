
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
  sectionNames?: string[];
  roleIds?: number[];
  customeFields?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}
