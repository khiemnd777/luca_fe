import { mapper } from "@core/mapper/auto-mapper";
import type { FieldDef } from "@core/form/types";
import type { FormSchema } from "@core/form/form.types";
import { registerFormDialog } from "@core/form/form-dialog.registry";
import { registerForm } from "@core/form/form-registry";
import { reloadTable } from "@core/table/table-reload";
import { create, id, search, update } from "@features/order/api/order.api";
import type { OrderUpsertModel } from "@features/order/model/order.model";
import { alphabetSeq } from "@root/shared/utils/string.utils";

export function buildNewOrderSchema(): FormSchema {
  const fields: FieldDef[] = [
    {
      kind: "searchsingle",
      name: "code",
      label: "Mã đơn hàng",
      placeholder: "Nhập mã đơn hàng",
      fullWidth: true,

      onBlur: async (text, matched, ctx) => {
        ctx?.setValue("code", text);
        if (matched) {
          const vid = matched.id;
          const result = await id(vid);
          console.log(result);
          if (result.latestOrderItem) {
            const seq = result.latestOrderItem.remakeCount + 1;
            result.latestOrderItem.remakeCount = seq;
            result.latestOrderItem.code = `${alphabetSeq(seq)}${matched.code}`;
            ctx?.setInitial(result);
          }
        } else {
          ctx?.setInitial({ code: text });
        }
      },

      getOptionLabel: (d: any) => d?.code,
      getOptionValue: (d: any) => d?.code,

      async searchPage(kw: string, page, limit) {
        const searched = await search({
          keyword: kw,
          limit: limit,
          page: page,
          orderBy: "code",
        });
        return searched.items;
      },

      pageLimit: 20,

      async hydrateByIds(ids: Array<number | string>, _: Record<string, any>) {
        if (!ids || ids.length === 0) return [];
        const single = await id(ids[0] as number);
        if (!single) return [];
        const items = [single];
        const set = new Set(ids.map(String));
        return (items ?? []).filter((d: any) => set.has(String(d.id)));
      },

      async fetchList(values: Record<string, any>) {
        const single = await id(values.id);
        if (!single) return [];
        return [single];
      },

      renderItem: (d: any) => (<>{d?.code}</>),
      disableDelete: (d: any) => d?.locked === true,
      autoLoadAllOnMount: true,
    },
    {
      name: "code",
      prop: "latestOrderItem",
      kind: "text",
      label: "Mã đơn làm lại",
      showIf: (values) => values["latestOrderItem.remakeCount"] > 0,
    },
    {
      name: "remakeCount",
      prop: "latestOrderItem",
      kind: "text",
      label: "Số lần làm lại",
      showIf: (values) => values["latestOrderItem.remakeCount"] > 0,
      disableIf: (_) => true,
    },
    {
      name: "",
      label: "",
      kind: "metadata",
      metadata: {
        collection: "order",
        mode: "whole",
      }
    },
    {
      name: "",
      label: "",
      kind: "metadata",
      prop: "latestOrderItem",
      metadata: {
        collection: "order-item-remake",
        mode: "whole",
      }
    },
    {
      name: "",
      label: "",
      kind: "metadata",
      prop: "latestOrderItem",
      metadata: {
        collection: "order-item",
        mode: "whole",
      }
    },
  ];

  return {
    idField: "id",
    fields,
    modeResolver: (_) => {
      return "create";
    },
    submit: {
      create: {
        type: "fn",
        run: async (dto) => {
          await create(dto as OrderUpsertModel);
          return dto;
        },
      },
      update: {
        type: "fn",
        run: async (dto) => {
          await update(dto as OrderUpsertModel);
          return dto;
        },
      },
    },

    toasts: {
      saved: ({ mode, values }) =>
        mode === "create"
          ? `Tạo đơn hàng "${values?.name ?? ""}" thành công!`
          : `Cập nhật đơn hàng "${values?.name ?? ""}" thành công!`,
      failed: ({ mode, values }) =>
        mode === "create"
          ? `Tạo đơn hàng "${values?.name ?? ""}" thất bại, xin thử lại!`
          : `Cập nhật đơn hàng "${values?.name ?? ""}" thất bại, xin thử lại!`,
    },

    async initialResolver(data: any) {
      if (data) {
        return await id(data.id);
      }
      return {};
    },

    async afterSaved() {
      reloadTable("orders");
    },

    hooks: {
      mapToDto: (v) => mapper.map("Order", v, "model_to_dto"),
    },
  };
}

registerForm("order-new", buildNewOrderSchema);

registerFormDialog("order-new", buildNewOrderSchema, {
  title: { create: "Tạo đơn hàng mới", update: "Cập nhật đơn hàng" },
  confirmText: { create: "Thêm", update: "Lưu" },
  cancelText: "Thoát",
});
