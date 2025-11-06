import * as React from "react";
import { AutoForm } from "@core/form/auto-form";
import type { AutoFormRef, FormSchema } from "@core/form/form.types";
import { subscribe, closeFormDialog, type Payload } from "@core/form/form-dialog.service";
import { getFormDialogBuilder, getFormDialogDefaults } from "@core/form/form-dialog.registry";
import { getFormSchema } from "@core/form/form-registry";
import { FormDialog } from "@shared/components/dialog/form-dialog";
import { pickModeText, resolveMode, resolveTitle } from "@core/form/form-dialog-mode.helper";

export function FormDialogHost() {
  // ---- states/refs (always the same order) ----
  const [payload, setPayload] = React.useState<Payload>(null);
  const [open, setOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [resolvedInitial, setResolvedInitial] = React.useState<Record<string, any> | null>(null);
  const [resolvingInitial, setResolvingInitial] = React.useState(false);
  const autoRef = React.useRef<AutoFormRef | null>(null);

  // ---- subscribe effect (always mounts) ----
  React.useEffect(() => {
    const unsub = subscribe((p) => {
      setPayload(p);
      setOpen(!!p);
      // reset initial khi mở form mới
      if (p) setResolvedInitial(null);
    });
    return unsub; // must return () => void
  }, []);

  // ---- resolve initial effect (always defined, but short-circuits if no payload) ----
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!payload) return;
      const schema = getFormSchema(payload.name) ?? getFormDialogBuilder(payload.name);
      setResolvingInitial(true);
      try {
        const base = payload.options?.initial; // không ép về null ở đây để dễ debug
        // DEBUG: xem Host nhận được gì
        console.debug("[FormDialogHost] options.initial =", base);

        const resolved = schema?.initialResolver
          ? await Promise.resolve(schema.initialResolver(base))
          : base;

        const finalInitial =
          base && resolved && typeof base === "object" && typeof resolved === "object"
            ? { ...base, ...resolved } // giữ id từ base
            : (resolved ?? base ?? {});

        if (!cancelled) setResolvedInitial(finalInitial);
      } finally {
        if (!cancelled) setResolvingInitial(false);
      }
    })();
    return () => { cancelled = true; };
  }, [payload?.name, payload?.options?.initial, payload]);

  // ---- derive các biến render (không thêm hooks mới) ----
  const name = payload?.name;
  const options = payload?.options;

  const defaults = name ? (getFormDialogDefaults(name) ?? {}) : {};
  const schema = name ? (getFormSchema(name) ?? getFormDialogBuilder(name)) : null;

  // mode chỉ có ý nghĩa khi đã resolve được initial & có schema
  const mode = schema && resolvedInitial ? resolveMode(schema as FormSchema, resolvedInitial) : "create";

  // ctx cho ModeText (values dùng initial mở form; không cần live update)
  const modeCtx = { mode, values: resolvedInitial ?? {}, initial: resolvedInitial };

  const titleNode =
    resolveTitle(
      (options?.title !== undefined ? options.title : defaults.title) as any,
      modeCtx
    ) ?? "Form";

  const confirmText =
    pickModeText(
      (options?.confirmText ?? defaults.confirmText) as any,
      modeCtx
    ) ?? (mode === "create" ? "Create" : "Save");

  const cancelText = options?.cancelText ?? defaults.cancelText ?? "Cancel";
  const maxWidth = options?.maxWidth ?? defaults.maxWidth ?? "sm";

  // ---- render (được phép return conditionally ở ĐÂY, sau khi hooks đã được khai báo) ----
  if (!payload) return null;

  if (!schema) {
    return (
      <FormDialog
        open={open}
        title={`Schema "${name}" chưa được đăng ký`}
        confirmText="OK"
        cancelText="Close"
        submitting={false}
        onClose={() => { setOpen(false); closeFormDialog(); }}
        onSubmit={() => { setOpen(false); closeFormDialog(); }}
        maxWidth={maxWidth}
      >
        <div>Vui lòng import file register của schema trước khi mở dialog.</div>
      </FormDialog>
    );
  }

  return (
    <FormDialog
      open={open}
      title={titleNode as any}
      confirmText={confirmText}
      cancelText={cancelText}
      submitting={submitting || resolvingInitial}
      onClose={() => {
        payload?.reject?.(new Error("cancelled"));
        setOpen(false);
        closeFormDialog();
      }}
      onSubmit={async () => {
        if (!autoRef.current) return;
        setSubmitting(true);
        try {
          const okOrResult = await autoRef.current.submit();
          if (!okOrResult) return;
          await payload?.options?.onSaved?.(autoRef.current.values);
          payload?.resolve?.(autoRef.current.values);
          setOpen(false);
          closeFormDialog();
        } finally {
          setSubmitting(false);
        }
      }}
      maxWidth={maxWidth}
    >
      {resolvingInitial ? (
        <div>Loading…</div>
      ) : (
        <AutoForm
          key={`${name}:${resolvedInitial?.id ?? "new"}`}
          ref={autoRef}
          schema={schema}
          name={name!}
          initial={resolvedInitial ?? undefined}
        />
      )}
    </FormDialog>
  );
}
