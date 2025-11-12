import { registerForm } from "@core/form/form-registry";
import { registerFormDialog } from "@core/form/form-dialog.registry";
import { buildStaffSchemaShared } from "./staff.schema.shared";

export function buildStaffNonPasswordSchema() {
  return buildStaffSchemaShared({ withPassword: false });
}

registerForm("staff-non-password", buildStaffNonPasswordSchema);
registerFormDialog("staff-non-password", buildStaffNonPasswordSchema, {
  title: { create: "Thêm nhân sự", update: "Cập nhật nhân sự" },
  confirmText: { create: "Thêm", update: "Lưu" },
  cancelText: "Thoát",
});
