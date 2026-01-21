import type { FetchTableOpts } from "@core/table/table.types";
import type { ListResult } from "@core/types/list-result";
import type { CreatePromotionInputModel, PromotionCodeModel, UpdatePromotionInputModel } from "@features/promotion/model/promotion.model";
import { apiClient } from "@core/network/api-client";
import { useAuthStore } from "@store/auth-store";
import { mapper } from "@core/mapper/auto-mapper";

export async function list(tableOpts: FetchTableOpts): Promise<ListResult<PromotionCodeModel>> {
  const { departmentApiPath } = useAuthStore.getState();
  const { data } = await apiClient.getTable<any[]>(`${departmentApiPath()}/promotion/list`, tableOpts);
  const result = mapper.map<any[], ListResult<PromotionCodeModel>>("PromotionCode", data, "dto_to_model");
  return result;
}

export async function id(id: number): Promise<PromotionCodeModel> {
  const { departmentApiPath } = useAuthStore.getState();
  id = id === undefined ? -1 : id;
  const { data } = await apiClient.get<any>(`${departmentApiPath()}/promotion/${id}`);
  const result = mapper.map<any, PromotionCodeModel>("PromotionCode", data, "dto_to_model");
  return result;
}

export async function create(input: CreatePromotionInputModel): Promise<PromotionCodeModel> {
  const { departmentApiPath } = useAuthStore.getState();
  const { data } = await apiClient.post<any>(`${departmentApiPath()}/promotion`, input);
  const result = mapper.map<any, PromotionCodeModel>("PromotionCode", data, "dto_to_model");
  return result;
}

export async function update(id: number, input: UpdatePromotionInputModel): Promise<void> {
  const { departmentApiPath } = useAuthStore.getState();
  await apiClient.put<any>(`${departmentApiPath()}/promotion/${id}`, input);
}

export async function remove(id: number): Promise<void> {
  const { departmentApiPath } = useAuthStore.getState();
  await apiClient.delete<any>(`${departmentApiPath()}/promotion/${id}`);
}

type PromotionValidatePayload = {
  promo_code: string;
  order_id: number;
};

type PromotionValidateResponseDto = {
  valid: boolean;
  reason?: string;
  discount_amount?: number;
  final_price?: number;
};

export type PromotionValidateResult = {
  valid: boolean;
  reason?: string;
  discountAmount?: number;
  finalPrice?: number;
};

export async function validatePromotion(payload: { promoCode: string; orderId: number }): Promise<PromotionValidateResult> {
  const { departmentApiPath } = useAuthStore.getState();
  const { data } = await apiClient.post<PromotionValidateResponseDto>(`${departmentApiPath()}/promotions/validate`, {
    promo_code: payload.promoCode,
    order_id: payload.orderId,
  } as PromotionValidatePayload);

  return {
    valid: data.valid,
    reason: data.reason,
    discountAmount: data.discount_amount,
    finalPrice: data.final_price,
  };
}

type PromotionApplyPayload = {
  promo_code: string;
  order_id: number;
};

type PromotionApplyResponseDto = {
  success: boolean;
  reason?: string;
  applied_discount?: number;
  promo_snapshot?: unknown;
};

export type PromotionApplyResult = {
  success: boolean;
  reason?: string;
  appliedDiscount?: number;
  promoSnapshot?: unknown;
};

export async function applyPromotion(payload: { promoCode: string; orderId: number }): Promise<PromotionApplyResult> {
  const { departmentApiPath } = useAuthStore.getState();
  const { data } = await apiClient.post<PromotionApplyResponseDto>(`${departmentApiPath()}/promotions/apply`, {
    promo_code: payload.promoCode,
    order_id: payload.orderId,
  } as PromotionApplyPayload);

  return {
    success: data.success,
    reason: data.reason,
    appliedDiscount: data.applied_discount,
    promoSnapshot: data.promo_snapshot,
  };
}
