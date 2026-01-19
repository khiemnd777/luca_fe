import type { FieldDef } from "@core/form/types";
import type { FormSchema } from "@core/form/form.types";
import { registerFormDialog } from "@core/form/form-dialog.registry";
import { registerForm } from "@core/form/form-registry";
import { reloadTable } from "@core/table/table-reload";
import { create, id, update } from "@features/promotion/api/promotion.api";
import type {
  CreatePromotionInputModel,
  UpdatePromotionInputModel,
} from "@features/promotion/model/promotion.model";

const parseDateTime = (value: any): number | null => {
  if (!value) return null;
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? null : time;
};

const validateStartAt = async (value: any, values: Record<string, any>) => {
  const start = parseDateTime(value);
  const end = parseDateTime(values.endAt);

  if (value && start == null) return "Ngày bắt đầu không hợp lệ";
  if (values.endAt && end == null) return "Ngày kết thúc không hợp lệ";
  if (start != null && end != null && start > end)
    return "Ngày bắt đầu phải trước ngày kết thúc";

  return null;
};

const validateEndAt = async (value: any, values: Record<string, any>) => {
  const start = parseDateTime(values.startAt);
  const end = parseDateTime(value);

  if (value && end == null) return "Ngày kết thúc không hợp lệ";
  if (values.startAt && start == null) return "Ngày bắt đầu không hợp lệ";
  if (start != null && end != null && end < start)
    return "Ngày kết thúc phải sau ngày bắt đầu";

  return null;
};

const promotionLabel = (values: any) =>
  values?.dto?.code ?? values?.code ?? "";

export function buildPromotionSchema(): FormSchema {
  const fields: FieldDef[] = [
    {
      name: "code",
      label: "Mã khuyến mãi",
      kind: "text",
      rules: {
        required: "Yêu cầu nhập mã khuyến mãi",
        maxLength: 50,
      },
    },
    {
      name: "discountType",
      label: "Loại giảm",
      kind: "text",
      rules: {
        required: "Yêu cầu nhập loại giảm",
        maxLength: 50,
      },
    },
    {
      name: "discountValue",
      label: "Giá trị giảm",
      kind: "number",
      rules: {
        required: "Yêu cầu nhập giá trị giảm",
        min: 0,
      },
      step: 1,
    },
    {
      name: "maxDiscountAmount",
      label: "Giảm tối đa",
      kind: "number",
      rules: {
        min: 0,
      },
      step: 1,
    },
    {
      name: "minOrderValue",
      label: "Giá trị đơn hàng tối thiểu",
      kind: "number",
      rules: {
        min: 0,
      },
      step: 1,
    },
    {
      name: "totalUsageLimit",
      label: "Giới hạn sử dụng",
      kind: "number",
      rules: {
        min: 0,
      },
      step: 1,
    },
    {
      name: "usagePerUser",
      label: "Giới hạn mỗi khách hàng",
      kind: "number",
      rules: {
        min: 0,
      },
      step: 1,
    },
    {
      name: "startAt",
      label: "Thời gian bắt đầu",
      kind: "datetime",
      rules: {
        async: validateStartAt,
      },
    },
    {
      name: "endAt",
      label: "Thời gian kết thúc",
      kind: "datetime",
      rules: {
        async: validateEndAt,
      },
    },
    {
      name: "isActive",
      label: "Kích hoạt",
      kind: "switch",
      defaultValue: true,
    },
  ];

  return {
    idField: "id",
    fields,
    submit: {
      create: {
        type: "fn",
        run: async (values) => {
          const payload = values.dto as CreatePromotionInputModel;
          await create(payload);
          return values.dto;
        },
      },
      update: {
        type: "fn",
        run: async (values) => {
          const dto = values.dto as Record<string, any>;
          const { id: promotionId, ...payload } = dto;
          await update(
            Number(promotionId),
            payload as UpdatePromotionInputModel,
          );
          return values.dto;
        },
      },
    },
    toasts: {
      saved: ({ mode, values }) =>
        mode === "create"
          ? `Tạo khuyến mãi "${promotionLabel(values)}" thành công!`
          : `Cập nhật khuyến mãi "${promotionLabel(values)}" thành công!`,
      failed: ({ mode, values }) =>
        mode === "create"
          ? `Tạo khuyến mãi "${promotionLabel(values)}" thất bại, vui lòng thử lại!`
          : `Cập nhật khuyến mãi "${promotionLabel(values)}" thất bại, vui lòng thử lại!`,
    },
    async initialResolver(data: any) {
      if (data) {
        return await id(data.id);
      }
      return {};
    },
    async afterSaved() {
      reloadTable("promotions");
    },
  };
}

registerForm("promotion", buildPromotionSchema);

registerFormDialog("promotion", buildPromotionSchema, {
  title: {
    create: "Thêm khuyến mãi",
    update: "Cập nhật khuyến mãi",
  },
  confirmText: {
    create: "Thêm",
    update: "Lưu",
  },
  cancelText: "Thoát",
});
