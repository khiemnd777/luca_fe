export interface PromotionCodeModel {
  id: number;
  code: string;
  name?: string;
  discountType: string;
  discountValue: number;
  maxDiscountAmount?: number;
  minOrderValue?: number;
  totalUsageLimit?: number;
  usagePerUser?: number;
  startAt: string;
  endAt: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePromotionInputModel {
  code: string;
  discountType: string;
  discountValue: number;
  maxDiscountAmount?: number;
  minOrderValue?: number;
  totalUsageLimit?: number;
  usagePerUser?: number;
  startAt?: string;
  endAt?: string;
  isActive: boolean;
}

export interface UpdatePromotionInputModel {
  discountType: string;
  discountValue: number;
  maxDiscountAmount?: number;
  minOrderValue?: number;
  totalUsageLimit?: number;
  usagePerUser?: number;
  startAt?: string;
  endAt?: string;
  isActive?: boolean;
}
