import { mapper } from "@core/mapper/auto-mapper";
import type { FieldDef } from "@core/form/types";
import type { FormSchema } from "@core/form/form.types";
import { registerFormDialog } from "@core/form/form-dialog.registry";
import { registerForm } from "@core/form/form-registry";
import { reloadTable } from "@core/table/table-reload";
import { create, id, update } from "@features/order/api/order.api";
import type { OrderUpsertModel } from "@features/order/model/order.model";

export function buildOrderSchema(): FormSchema {
  const fields: FieldDef[] = [
    {
      name: "code",
      label: "Mã đơn hàng",
      kind: "text",
      rules: {
        required: "Yêu cầu nhập mã đơn hàng",
        maxLength: 30,
      },
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
    submit: {
      create: {
        type: "fn",
        run: async (dto) => {
          console.log("==== values ====");
          console.log(dto);
          console.log(JSON.stringify(dto));
          await create(dto as OrderUpsertModel);
          return dto;
        },
      },
      update: {
        type: "fn",
        run: async (values) => {
          await update(values as OrderUpsertModel);
          return values;
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

registerForm("order", buildOrderSchema);

registerFormDialog("order", buildOrderSchema, {
  title: { create: "Tạo đơn hàng mới", update: "Cập nhật đơn hàng" },
  confirmText: { create: "Thêm", update: "Lưu" },
  cancelText: "Thoát",
});
