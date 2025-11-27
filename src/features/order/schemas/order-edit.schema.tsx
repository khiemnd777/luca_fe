import { mapper } from "@core/mapper/auto-mapper";
import type { FieldDef } from "@core/form/types";
import type { FormSchema } from "@core/form/form.types";
import { registerFormDialog } from "@core/form/form-dialog.registry";
import { registerForm } from "@core/form/form-registry";
import { reloadTable } from "@core/table/table-reload";
import { create, id, update } from "@features/order/api/order.api";
import type { OrderUpsertModel } from "@features/order/model/order.model";

export function buildEditOrderSchema(): FormSchema {
  const fields: FieldDef[] = [
    {
      kind: "text",
      name: "codeLatest",
      label: "Mã đơn hàng",
      disableIf: () => true,
    },
    {
      kind: "text",
      name: "code",
      label: "Mã gốc",
      disableIf: () => true,
    },
    {
      kind: "text",
      name: "remakeCount",
      prop: "latestOrderItem",
      label: "Số lần làm lại",
      disableIf: () => true,
      showIf: (v) => v["latestOrderItem.remakeCount"] > 0,
    },
    {
      kind: "text",
      name: "customerName",
      label: "Khách hàng",
      disableIf: () => true,
    },
    {
      kind: "text",
      name: "productName",
      label: "Sản phẩm",
      group: "product",
      disableIf: () => true,
    },
    {
      name: "",
      label: "",
      kind: "metadata",
      metadata: {
        collection: "order",
        mode: "whole",
        ignoreFields: ["customerId"],
        def: [
          {
            name: "patientName",
            disableIf: () => true,
          },
          // {
          //   name: "customerId",
          //   showIf: () => false,
          // },
        ]
      }
    },
    {
      name: "",
      label: "",
      kind: "metadata",
      prop: "latestOrderItem",
      metadata: {
        collection: "order-item-product",
        mode: "whole",
        groups: [
          {
            group: "product",
          }
        ],
        ignoreFields: ["productId"],
        def: [
          {
            name: "productCategory",
            disableIf: () => true,
          }
        ],
      }
    },
    {
      name: "",
      label: "",
      kind: "metadata",
      prop: "latestOrderItem",
      metadata: {
        collection: "order-item-tooth",
        mode: "whole",
        groups: [
          {
            group: "product",
          }
        ],
        def: [
          {
            name: "toothPositions",
            disableIf: () => true,
          }
        ],
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
        groups: [
          {
            group: "remake",
          }
        ],
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
        groups: [
          {
            group: "price",
            fields: ["retailPrice", "quantity", "vat", "discountPrice"],
          },
          {
            group: "total-price",
            fields: ["totalPrice"],
          },
          {
            group: "status",
            fields: ["status", "priority"],
          },
          {
            group: "note",
            fields: ["note"],
          },
        ],
      }
    },
  ];

  return {
    idField: "id",
    fields,
    groups: [
      {
        name: "general",
        label: "Thông tin chung:",
        col: 2,
      },
      {
        name: "remake",
        col: 1,
      },
      {
        name: "note",
        col: 1,
      },
      {
        name: "status",
        col: 2,
      },
      {
        name: "product",
        label: "Sản phẩm:",
        col: 3,
      },
      {
        name: "price",
        label: "Giá:",
        col: 4,
      },
      {
        name: "total-price",
        col: 1,
      }
    ],
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

registerForm("order-edit", buildEditOrderSchema);

registerFormDialog("order-edit", buildEditOrderSchema, {
  title: { create: "Tạo đơn hàng mới", update: "Cập nhật đơn hàng" },
  confirmText: { create: "Thêm", update: "Lưu" },
  cancelText: "Thoát",
});
