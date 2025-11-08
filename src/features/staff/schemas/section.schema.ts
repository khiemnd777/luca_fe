import type { FieldDef } from "@core/form/types";
import type { FormSchema } from "@core/form/form.types";
import { mapper } from "@core/mapper/auto-mapper";
import { registerFormDialog } from "@core/form/form-dialog.registry";
import { reloadTable } from "@core/table/table-reload";
import { create, fetchById, update } from "@features/staff/api/section.api";
import type { SectionModel } from "@features/staff/model/section.model";

export function buildSectionSchema(): FormSchema {
  const fields: FieldDef[] = [
    {
      name: "name",
      label: "Tên bộ phận",
      kind: "text",
      rules: {
        required: "Yêu cầu nhập tên bộ phận",
        maxLength: 50,
      },
    },
    {
      name: "description",
      label: "Mô tả",
      kind: "textarea",
      rules: {
        maxLength: 300,
      },
    },
  ];

  return {
    idField: "id",
    fields,
    submit: {
      create: {
        type: "fn",
        run: async (values) => {
          await create(values as SectionModel);
          return values;
        },
      },
      update: {
        type: "fn",
        run: async (values) => {
          await update(values as SectionModel);
          return values;
        },
      },
    },

    toasts: {
      saved: ({ mode, values }) =>
        mode === "create"
          ? `Tạo bộ phận "${values?.name ?? ""}" thành công!`
          : `Cập nhật bộ phận "${values?.name ?? ""}" thành công!`,
      failed: ({ mode, values }) =>
        mode === "create"
          ? `Tạo bộ phận "${values?.name ?? ""}" thất bại, xin thử lại!`
          : `Cập nhật bộ phận "${values?.name ?? ""}" thất bại, xin thử lại!`,
    },

    async initialResolver(data: any) {
      if (data) {
        return await fetchById(data.id);
      }
      return {};
    },

    async afterSaved() {
      reloadTable("sections");
    },

    hooks: {
      mapToDto: (v) => mapper.map("Section", v, "model_to_dto"),
    },
  };
}

registerFormDialog("section", buildSectionSchema, {
  title: { create: "Thêm bộ phận", update: "Cập nhật bộ phận" },
  confirmText: { create: "Thêm", update: "Lưu" },
  cancelText: "Thoát",
});
