import { mapper } from "@core/mapper/auto-mapper";
import type { FieldDef } from "@core/form/types";
import type { FormSchema } from "@core/form/form.types";
import { registerFormDialog } from "@core/form/form-dialog.registry";
import { registerForm } from "@core/form/form-registry";
import { reloadTable } from "@core/table/table-reload";
import { create, id, update } from "@features/product/api/product.api";
import type { ProductModel } from "@features/product/model/product.model";

export function buildSampleSchema(): FormSchema {
  const fields: FieldDef[] = [
    {
      name: "code",
      label: "Mã sản phẩm",
      kind: "text",
      rules: {
        required: "Yêu cầu nhập mã sản phẩm",
        maxLength: 30,
      },
    },
    {
      name: "name",
      label: "Tên sản phẩm",
      kind: "text",
      rules: {
        required: "Yêu cầu nhập tên sản phẩm",
        maxLength: 200,
      },
    },
    {
      name: "",
      label: "",
      kind: "metadata",
      metadata: {
        collection: "product",
        mode: "whole",
        groups: [
          {
            group: "type",
            fields: ["customFields.type"],
          },
          {
            group: "process",
            fields: ["customFields.processIds"],
          }
        ],
      }
    },
    {
      name: "",
      label: "",
      kind: "metadata",
      metadata: {
        collection: "product-a",
        mode: "whole",
        groups: [
          {
            group: "type",
          }
        ],
      }
    },
    {
      name: "",
      label: "",
      kind: "metadata",
      metadata: {
        collection: "product-b",
        mode: "whole",
        groups: [
          {
            group: "type",
          }
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
        label: "Thông tin chung",
        col: 2,
      },
      {
        name: "type",
        label: "Kiểu",
        col: 1,
      },
      {
        name: "process",
        label: "Công đoạn",
        col: 1,
      },
    ],
    submit: {
      create: {
        type: "fn",
        run: async (values, meta) => {
          await create({
            dto: values as ProductModel,
            collections: meta?.map((m) => m.meta.metadata?.collection)
          });
          return values;
        },
      },
      update: {
        type: "fn",
        run: async (values, meta) => {
          await update({
            dto: values as ProductModel,
            collections: meta?.map((m) => m.meta.metadata?.collection)
          });
          return values;
        },
      },
    },

    toasts: {
      saved: ({ mode, values }) =>
        mode === "create"
          ? `Tạo sản phẩm "${values?.name ?? ""}" thành công!`
          : `Cập nhật sản phẩm "${values?.name ?? ""}" thành công!`,
      failed: ({ mode, values }) =>
        mode === "create"
          ? `Tạo sản phẩm "${values?.name ?? ""}" thất bại, xin thử lại!`
          : `Cập nhật sản phẩm "${values?.name ?? ""}" thất bại, xin thử lại!`,
    },

    async initialResolver(data: any) {
      if (data) {
        return await id(data.id);
      }
      return {};
    },

    async afterSaved() {
      reloadTable("products");
    },

    hooks: {
      mapToDto: (v) => mapper.map("Product", v, "model_to_dto"),
    },
  };
}

registerForm("product", buildSampleSchema);

registerFormDialog("product", buildSampleSchema, {
  title: { create: "Thêm sản phẩm", update: "Cập nhật sản phẩm" },
  confirmText: { create: "Thêm", update: "Lưu" },
  cancelText: "Thoát",
});
