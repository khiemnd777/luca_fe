import { mapper } from "@core/mapper/auto-mapper";
import type { FieldDef } from "@core/form/types";
import type { FormSchema } from "@core/form/form.types";
import { registerFormDialog } from "@core/form/form-dialog.registry";
import { registerForm } from "@core/form/form-registry";
import { reloadTable } from "@core/table/table-reload";
import { create, id, update } from "@features/material/api/material.api";
import type { MaterialModel } from "@features/material/model/material.model";
import { openFormDialog } from "@root/core/form/form-dialog.service";
import { rel, search } from "@core/relation/relation.api";

export function buildSampleSchema(): FormSchema {
  const fields: FieldDef[] = [
    {
      name: "code",
      label: "Mã vật tư",
      kind: "text",
      rules: {
        required: "Yêu cầu nhập mã vật tư",
        maxLength: 30,
      },
    },
    {
      name: "name",
      label: "Tên vật tư",
      kind: "text",
      rules: {
        required: "Yêu cầu nhập tên vật tư",
        maxLength: 200,
      },
    },
    {
      name: "",
      label: "",
      kind: "metadata",
      metadata: {
        collection: "material",
        mode: "whole",
      }
    },
    {
      name: "supplierIds",
      label: "Nhà cung cấp",
      kind: "searchlist",
      placeholder: "Tìm nhà cung cấp...",
      fullWidth: true,

      getOptionLabel: (d: any) => d.name,
      getOptionValue: (d: any) => d.id,

      async searchPage(kw: string, page, limit) {
        const searched = await search("material", {
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
        const table = await rel("material", values.id, {
          limit: 10000,
          page: 1,
          orderBy: "name",
        });
        const set = new Set(ids.map(String));
        return (table.items ?? []).filter((d: any) => set.has(String(d.id)));
      },

      async fetchList(values: Record<string, any>) {
        const table = await rel("material", values.id, {
          limit: 10000,
          page: 1,
          orderBy: "name",
        });
        return table.items;
      },

      renderItem: (d: any) => (<>{d.name}</>),
      disableDelete: (d: any) => d.locked === true,
      onOpenCreate: () => openFormDialog("supplier"),
      autoLoadAllOnMount: true,
    }
  ];

  return {
    idField: "id",
    fields,
    submit: {
      create: {
        type: "fn",
        run: async (values) => {
          await create(values as MaterialModel);
          return values;
        },
      },
      update: {
        type: "fn",
        run: async (values) => {
          await update(values as MaterialModel);
          return values;
        },
      },
    },

    toasts: {
      saved: ({ mode, values }) =>
        mode === "create"
          ? `Tạo vật tư "${values?.name ?? ""}" thành công!`
          : `Cập nhật vật tư "${values?.name ?? ""}" thành công!`,
      failed: ({ mode, values }) =>
        mode === "create"
          ? `Tạo vật tư "${values?.name ?? ""}" thất bại, xin thử lại!`
          : `Cập nhật vật tư "${values?.name ?? ""}" thất bại, xin thử lại!`,
    },

    async initialResolver(data: any) {
      if (data) {
        return await id(data.id);
      }
      return {};
    },

    async afterSaved() {
      reloadTable("materials");
    },

    hooks: {
      mapToDto: (v) => mapper.map("Material", v, "model_to_dto"),
    },
  };
}

registerForm("material", buildSampleSchema);

registerFormDialog("material", buildSampleSchema, {
  title: { create: "Thêm vật tư", update: "Cập nhật vật tư" },
  confirmText: { create: "Thêm", update: "Lưu" },
  cancelText: "Thoát",
});
