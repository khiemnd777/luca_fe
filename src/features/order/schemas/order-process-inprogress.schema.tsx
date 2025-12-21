import { mapper } from "@core/mapper/auto-mapper";
import type { FieldDef, FormContext } from "@core/form/types";
import type { FormSchema } from "@core/form/form.types";
import { registerForm } from "@core/form/form-registry";
import { registerFormDialog } from "@root/core/form/form-dialog.registry";
import { rel1, search } from "@core/relation/relation.api";
import { parseIntSafe } from "@root/shared/utils/number.utils";
import type { OrderItemProcessUpsertModel } from "../model/order-item-process.model";
import { checkInOrOut } from "../api/order-item-process.api";
import { navigate } from "@root/core/navigation/navigate";

const buildRelationSearchSingleField = (
  name: string,
  label: string,
  placeholder: string,
  target: string,
  extendWhere?: (ctx?: FormContext) => string[],
): FieldDef => ({
  name,
  label,
  kind: "searchsingle",
  placeholder,
  fullWidth: true,
  size: "small",
  pageLimit: 20,
  getInputLabel: (d: any) => d?.processName ?? "",
  getOptionLabel: (d: any) => `${d?.sectionName ? `${d?.sectionName} > ` : ""}${d?.processName ?? ""}`,
  getOptionValue: (d: any) => d?.id,
  async searchPage(keyword: string, page: number, limit: number, ctx?: FormContext) {
    const searched = await search(target, {
      keyword,
      page,
      limit,
      orderBy: "name",
      extendWhere: extendWhere?.(ctx),
    });
    return searched.items;
  },
  async hydrateById(idValue: number | string) {
    if (!idValue) return null;
    return await rel1(target, Number(idValue));
  },
  async fetchOne(values: Record<string, any>) {
    const refId = parseIntSafe(values[name]);
    if (!refId) return null;
    return await rel1(target, refId);
  },
  autoLoadAllOnMount: true,
});

export function buildOrderProcessInProgressSchema(): FormSchema {
  const fields: FieldDef[] = [
    buildRelationSearchSingleField(
      "processId",
      "Công đoạn",
      "Chọn công đoạn",
      "orderitem_process",
    ),
    buildRelationSearchSingleField(
      "assignedId",
      "Kỹ thuật viên",
      "Chọn kỹ thuật viên",
      "orderitemprocess_assignee",
      (ctx) => [`order_item_id=${ctx?.values.orderItemId}`]
    ),
    {
      name: "note",
      label: "Ghi chú",
      kind: "textarea",
      fullWidth: true,
      rows: 3,
    },
  ];

  return {
    idField: "id",
    fields,
    submit: {
      type: "fn",
      run: async (dto) => {
        const payload = dto as OrderItemProcessUpsertModel;
        await checkInOrOut(payload.dto.orderId ?? 0, payload.dto.orderItemId ?? 0, payload);
        return dto;
      },
    },
    toasts: {
      saved: ({ values }) =>
        `Check ${values?.processName ?? ""} thành công!`,
      failed: ({ values }) =>
        `Check ${values?.processName ?? ""} thất bại!`,
    },
    async initialResolver(data: any) {
      return data ?? {};
    },
    async afterSaved(result, ctx) {
      console.log("ctx", ctx, "result", result);
      navigate(`/order/${ctx.values.orderId}/historical/${ctx.values.orderItemId}/process/in-progresses`);
    },
    hooks: {
      mapToDto: (v) => mapper.map("OrderItemProcessInProgress", v, "model_to_dto"),
    },
  };
}

registerForm("order-process-inprogress", buildOrderProcessInProgressSchema);
registerFormDialog("order-process-inprogress", buildOrderProcessInProgressSchema, {
  title: { create: "", update: "Cập nhật công đoạn" },
  confirmText: { create: "", update: "Lưu" },
  cancelText: "Thoát",
});
