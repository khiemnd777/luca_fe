import type { FieldDef } from "@core/form/types";
import type { FormSchema } from "@core/form/form.types";
import { mapper } from "@core/mapper/auto-mapper";
import { registerFormDialog } from "@core/form/form-dialog.registry";
import { reloadTable } from "@core/table/table-reload";
import { create, id, update } from "@features/clinic/api/clinic.api";
import type { ClinicModel } from "@features/clinic/model/clinic.model";

export function buildClinicSchema(): FormSchema {
  const fields: FieldDef[] = [
    {
      name: "name",
      label: "Tên nha khoa",
      kind: "text",
      rules: {
        required: "Yêu cầu nhập tên nha khoa",
        maxLength: 50,
      },
    },
    {
      name: "brief",
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
          await create(values as ClinicModel);
          return values;
        },
      },
      update: {
        type: "fn",
        run: async (values) => {
          await update(values as ClinicModel);
          return values;
        },
      },
    },

    toasts: {
      saved: ({ mode, values }) =>
        mode === "create"
          ? `Tạo nha khoa "${values?.name ?? ""}" thành công!`
          : `Cập nhật nha khoa "${values?.name ?? ""}" thành công!`,
      failed: ({ mode, values }) =>
        mode === "create"
          ? `Tạo nha khoa "${values?.name ?? ""}" thất bại, xin thử lại!`
          : `Cập nhật nha khoa "${values?.name ?? ""}" thất bại, xin thử lại!`,
    },

    async initialResolver(data: any) {
      if (data) {
        return await id(data.id);
      }
      return {};
    },

    async afterSaved() {
      reloadTable("clinics");
    },

    hooks: {
      mapToDto: (v) => mapper.map("Clinic", v, "model_to_dto"),
    },
  };
}

registerFormDialog("clinic", buildClinicSchema, {
  title: { create: "Thêm nha khoa", update: "Cập nhật nha khoa" },
  confirmText: { create: "Thêm", update: "Lưu" },
  cancelText: "Thoát",
});
