import { mapper } from "@core/mapper/auto-mapper";
import type { FieldDef } from "@core/form/types";
import type { FormSchema } from "@core/form/form.types";
import { registerFormDialog } from "@core/form/form-dialog.registry";
import { registerForm } from "@core/form/form-registry";
import { uploadImages } from "@root/core/form/image-upload-utils";
import { reloadTable } from "@core/table/table-reload";
import { create, getById, update } from "@features/deparment/api/deparment.api";
import type { DeparmentModel } from "@features/deparment/model/deparment.model";

export function buildDeparmentSchema(): FormSchema {
  const fields: FieldDef[] = [
    {
      name: "name",
      label: "Tên chi nhánh",
      kind: "text",
      rules: {
        required: "Yêu cầu nhập tên chi nhánh",
        maxLength: 120,
      },
    },
    {
      name: "phoneNumber",
      label: "Số điện thoại",
      kind: "text",
      rules: {
        maxLength: 20,
      },
    },
    {
      name: "address",
      label: "Địa chỉ",
      kind: "text",
      rules: {
        maxLength: 300,
      },
    },
    {
      name: "logo",
      label: "Logo",
      kind: "imageupload",
      accept: "image/*",
      maxFiles: 1,
      multipleFiles: false,
      helperText: "PNG/JPG ≤ 2MB. Khuyến nghị hình vuông.",
      uploader: uploadImages,
    },
    {
      name: "active",
      label: "Kích hoạt",
      kind: "switch",
      defaultValue: true,
    },
  ];

  return {
    idField: "id",
    fields,
    submit: {
      create: {
        type: "fn",
        run: async (values) => {
          const deptId = Number(values.dto.parentId ?? values.dto.id ?? 0);
          return await create(deptId, values.dto as DeparmentModel);
        },
      },
      update: {
        type: "fn",
        run: async (values) => {
          const deptId = Number(values.dto.id ?? 0);
          return await update(deptId, values.dto as DeparmentModel);
        },
      },
    },
    async initialResolver(data: any) {
      if (data?.id) {
        return await getById(Number(data.id));
      }
      return {};
    },
    toasts: {
      saved: ({ mode, values }) =>
        mode === "create"
          ? `Tạo chi nhánh "${values?.name ?? ""}" thành công!`
          : `Cập nhật chi nhánh "${values?.name ?? ""}" thành công!`,
      failed: ({ mode, values }) =>
        mode === "create"
          ? `Tạo chi nhánh "${values?.name ?? ""}" thất bại, xin thử lại!`
          : `Cập nhật chi nhánh "${values?.name ?? ""}" thất bại, xin thử lại!`,
    },
    hooks: {
      mapToDto: (v) => mapper.map("Department", v, "model_to_dto"),
    },
    async afterSaved() {
      reloadTable("deparment-children");
    },
  };
}

registerForm("deparment", buildDeparmentSchema);

registerFormDialog("deparment", buildDeparmentSchema, {
  title: { create: "Thêm chi nhánh", update: "Cập nhật chi nhánh" },
  confirmText: { create: "Thêm", update: "Lưu" },
  cancelText: "Thoát",
});
