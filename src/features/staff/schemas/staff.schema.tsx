import { registerForm } from "@core/form/form-registry";
import { registerFormDialog } from "@core/form/form-dialog.registry";
import { buildStaffSchemaShared } from "./staff.schema.shared";

export function buildStaffSchema() {
  return buildStaffSchemaShared({ withPassword: true });
}

registerForm("staff", buildStaffSchema);
registerFormDialog("staff", buildStaffSchema, {
  title: { create: "Thêm nhân sự", update: "Cập nhật nhân sự" },
  confirmText: { create: "Thêm", update: "Lưu" },
  cancelText: "Thoát",
});
