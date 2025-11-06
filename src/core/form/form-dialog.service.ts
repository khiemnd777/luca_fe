import type { TitleProp } from "@core/form/form-dialog.registry";
import type { ModeText } from "./form.types";

export type OpenFormDialogOptions = {
  title?: TitleProp | null;
  confirmText?: ModeText;
  cancelText?: string;
  maxWidth?: "xs" | "sm" | "md" | "lg";
  /** override initial nếu muốn (nếu không, AutoForm sẽ dùng schema.initialResolver) */
  initial?: Record<string, any> | null;
  /** callback cục bộ (được gọi sau khi AutoForm submit ok, trước khi resolve) */
  onSaved?: (result: any) => void | Promise<void>;
};

export type Payload = {
  name: string;
  options?: OpenFormDialogOptions;
  resolve: (v: any) => void;
  reject: (e?: any) => void;
} | null;

type Listener = (p: Payload) => void;

let current: Payload = null;
const listeners = new Set<Listener>();

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  listener(current);
  return () => listeners.delete(listener);
}

function emit() { for (const l of listeners) l(current); }

export function openFormDialog(name: string, options?: OpenFormDialogOptions): Promise<any> {
  return new Promise((resolve, reject) => {
    current = { name, options, resolve, reject };
    emit();
  });
}

export function closeFormDialog() {
  current = null;
  emit();
}
