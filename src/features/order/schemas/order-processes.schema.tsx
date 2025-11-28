import { mapper } from "@core/mapper/auto-mapper";
import type { FieldDef } from "@core/form/types";
import type { FormSchema } from "@core/form/form.types";
import { registerForm } from "@core/form/form-registry";
import { create, update } from "@features/order/api/order.api";
import type { OrderUpsertModel } from "@features/order/model/order.model";

export function buildOrderProcessesSchema(): FormSchema {
  const fields: FieldDef[] = [
    {
      name: "",
      label: "",
      kind: "metadata",
      metadata: {
        collection: "order-item-process",
        mode: "whole",
      }
    },
  ];

  return {
    idField: "id",
    fields,
    modeResolver: (_) => {
      return "update";
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
          ? `Tạo công đoạn "${values?.processName ?? ""}" thành công!`
          : `Cập nhật đơn hàng "${values?.processName ?? ""}" thành công!`,
      failed: ({ mode, values }) =>
        mode === "create"
          ? `Tạo công đoạn "${values?.processName ?? ""}" thất bại, xin thử lại!`
          : `Cập nhật công đoạn "${values?.processName ?? ""}" thất bại, xin thử lại!`,
    },

    async initialResolver(data: any) {
      return data;
    },

    hooks: {
      mapToDto: (v) => mapper.map("Common", v, "model_to_dto"),
    },
  };
}

registerForm("order-processes", buildOrderProcessesSchema);
