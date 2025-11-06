import type { FieldDef } from "@core/form/types";
import type { FormSchema } from "@core/form/form.types";
import { mapper } from "@root/core/mapper/auto-mapper";
import { registerFormDialog } from "@root/core/form/form-dialog.registry";
import { slugify } from "@root/shared/utils/slugify";
import { createRole, fetchRoleByID, updateRole } from "@features/rbac/api/role.api";
import type { RoleModel } from "@features/rbac/model/role.model";

export function buildRoleSchema(): FormSchema {
  const fields: FieldDef[] = [
    {
      name: "displayName",
      label: "Tên hiển thị",
      kind: "text",
      rules: {
        required: "Yêu cầu nhập tên hiển thị",
        maxLength: 50,
      },
    },
    {
      name: "roleName",
      label: "Tên vai trò",
      kind: "text",
      derive: {
        field: "displayName",
        mode: "whenEmpty",
        map: (srcVal) => slugify(String(srcVal ?? "")),
      },
    },
    {
      name: "brief",
      label: "Mô tả",
      kind: "textarea",
      rules: { maxLength: 300 },
    },
  ];

  return {
    idField: "id",
    fields,
    submit: {
      create: {
        type: "fn",
        run: async (values) => {
          await createRole(values as RoleModel);
          return values;
        },
      },
      update: {
        type: "fn",
        run: async (values) => {
          await updateRole(values as RoleModel);
          return values;
        },
      },
    },

    toasts: {
      saved: ({ mode, values }) =>
        mode === "create"
          ? `Tạo vai trò "${values?.displayName ?? ""}" thành công!`
          : `Cập nhật vai trò "${values?.displayName ?? ""}" thành công!`,
      failed: ({ mode, values }) =>
        mode === "create"
          ? `Tạo vai trò "${values?.displayName ?? ""}" thất bại, xin thử lại!`
          : `Cập nhật vai trò "${values?.displayName ?? ""}" thất bại, xin thử lại!`,
    },

    async initialResolver(data: any) {
      if (data) {
        return await fetchRoleByID(data.id);
      }
      return {};
    },

    async afterSaved() {
    },

    hooks: {
      mapToDto: (v) => mapper.map("Role", v, "model_to_dto"),
    },
  };
}

registerFormDialog("role", buildRoleSchema, {
  title: { create: "Thêm vai trò", update: "Cập nhật vai trò" },
  confirmText: { create: "Thêm", update: "Lưu" },
  cancelText: "Thoát",
});
