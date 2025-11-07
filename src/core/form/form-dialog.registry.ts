// @core/form/form-dialog.registry.ts
import type { FormSchema } from "@core/form/form.types";

export type ModeText = string | { create: string; update: string };
export type TitleProp = React.ReactNode | ModeText;

export type FormDialogDefaults = {
  title?: TitleProp;
  confirmText?: ModeText;
  cancelText?: string;
  maxWidth?: "xs" | "sm" | "md" | "lg";
};

type Builder = () => FormSchema;

const dialogRegistry = new Map<
  string,
  { build?: Builder; defaults?: FormDialogDefaults }
>();

export function registerFormDialog(
  name: string,
  build?: Builder,
  defaults?: FormDialogDefaults
) {
  dialogRegistry.set(name, { build, defaults });
}

export function getFormDialogBuilder(name: string): FormSchema | undefined {
  return dialogRegistry.get(name)?.build?.();
}

export function getFormDialogDefaults(name: string): FormDialogDefaults | undefined {
  return dialogRegistry.get(name)?.defaults;
}

/* Ví dụ:
// form
registerForm("account", buildAccountSchema);

// dialog defaults (KHÔNG cần build lại nếu đã registerForm ở trên)
registerFormDialog("account", undefined, { title: "Tạo mới tài khoản", confirmText: "Lưu" });

// Nếu bạn muốn pass builder (không bắt buộc):
registerFormDialog("account", buildAccountSchema, { title: "Tạo mới tài khoản" });
*/