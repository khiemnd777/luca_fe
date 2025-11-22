import { mapper } from "@core/mapper/auto-mapper";
import type { FieldDef } from "@core/form/types";
import type { FormSchema } from "@core/form/form.types";
import { registerFormDialog } from "@core/form/form-dialog.registry";
import { registerForm } from "@core/form/form-registry";
import { reloadTable } from "@core/table/table-reload";
import { create, id, update } from "@features/product/api/product.api";
import type { ProductModel } from "@features/product/model/product.model";
import { search } from "@features/process/api/process.api";
import { rel } from "@core/relation/relation.api";
import { openFormDialog } from "@core/form/form-dialog.service";

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
      }
    },
    {
      name: "",
      label: "",
      kind: "metadata",
      metadata: {
        collection: "product-a",
        mode: "whole",
      }
    },
    {
      name: "",
      label: "",
      kind: "metadata",
      metadata: {
        collection: "product-b",
        mode: "whole",
      }
    },
    {
      name: "processIds",
      label: "Công đoạn",
      kind: "searchlist",
      group: "process",
      placeholder: "Tìm công đoạn sản xuất...",
      fullWidth: true,

      getOptionLabel: (d: any) => d.name,
      getOptionValue: (d: any) => d.id,

      async searchPage(kw: string, page, limit) {
        const searched = await search({
          keyword: kw,
          limit: limit,
          page: page,
          orderBy: "name",
        });
        return searched.items;
      },

      pageLimit: 20,

      async hydrateByIds(ids: Array<number | string>, values: Record<string, any>) {
        if (!ids || ids.length === 0) return [];
        const table = await rel("product", values.id, {
          limit: 10000,
          page: 1,
          orderBy: "name",
        });
        const set = new Set(ids.map(String));
        return (table.items ?? []).filter((d: any) => set.has(String(d.id)));
      },

      async fetchList(values: Record<string, any>) {
        const table = await rel("product", values.id, {
          limit: 10000,
          page: 1,
          orderBy: "name",
        });
        return table.items;
      },

      renderItem: (d: any) => (<>{d.name}</>),
      disableDelete: (d: any) => d.locked === true,
      onOpenCreate: () => openFormDialog("process"),
      autoLoadAllOnMount: true,
    }
  ];

  return {
    idField: "id",
    fields,
    groups: [
      {
        name: "general",
        col: 2,
      },
      {
        name: "process",
        col: 1,
      }
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
