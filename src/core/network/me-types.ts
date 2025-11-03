export interface MeDto {
  id: number;
  email: string;
  name?: string;
  phone?: string;
  active: boolean;
  avatar?: string;
  qrCode?: string | null;
}
