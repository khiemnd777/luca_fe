// @core/form/auto-form.tsx
import * as React from "react";
import { Stack } from "@mui/material";
import { AutoFormFields } from "@core/form/auto-form-fields";
import { useAutoForm } from "@core/form/use-auto-form";
import type { AutoFormRef, AutoFormProps, SubmitDef } from "@core/form/form.types";
import { getFormSchema } from "@core/form/form-registry";
import toast from "react-hot-toast";

const defaultFetcher = (input: string, init: RequestInit) => fetch(input, init);

async function runSubmit(def: SubmitDef, values: Record<string, any>) {
  if (def.type === "fn") return def.run(values);
  const method = def.method ?? "PATCH";
  const fetcher = def.fetcher ?? defaultFetcher;
  const payload = def.transform ? def.transform(values) : values;
  const res = await fetcher(def.url, {
    method,
    headers: { "Content-Type": "application/json", ...(def.headers ?? {}) },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try { const j = await res.json(); msg = j?.message || msg; } catch {}
    throw new Error(msg);
  }
  const data = await res.json().catch(() => null);
  return def.parseResponse ? def.parseResponse(data) : data;
}

type Props = AutoFormProps & {
  name?: string;
  notifier?: typeof toast;
};

export const AutoForm = React.forwardRef<AutoFormRef, Props>(
  ({ name, schema: schemaProp, initial, onSaved, notifier }, ref) => {
    const toasts = notifier ?? toast;

    // 1) Resolve schema (ưu tiên prop để backward-compatible)
    const schema = React.useMemo(() => {
      if (schemaProp) return schemaProp;
      if (name) return getFormSchema(name);
      return null as any;
    }, [schemaProp, name]);

    if (!schema) {
      return <div>Schema {name ? `"${name}"` : ""} chưa được đăng ký.</div>;
    }

    // 2) Resolve initial:
    // - Nếu có prop initial → dùng ngay
    // - Nếu không → thử schema.initialResolver
    const [resolvedInitial, setResolvedInitial] = React.useState<Record<string, any> | null>(
      initial ?? null
    );

    React.useEffect(() => {
      let cancelled = false;
      async function load() {
        if (initial != null) { setResolvedInitial(initial); return; }
        if (schema.initialResolver) {
          try {
            const v = await Promise.resolve(schema.initialResolver());
            if (!cancelled) setResolvedInitial(v ?? {});
          } catch {
            if (!cancelled) setResolvedInitial({});
          }
        } else {
          setResolvedInitial({});
        }
      }
      load();
      return () => { cancelled = true; };
    }, [initial, schema]);

    const stableInitial = React.useMemo(() => resolvedInitial ?? {}, [resolvedInitial]);

    // 3) Form state
    const { values, setValue, setAllValues, errors, setErrors, validateAll } = useAutoForm(
      schema.fields,
      stableInitial,
      { asyncValidate: schema.hooks?.asyncValidate }
    );

    const [_, setSaving] = React.useState(false);

    const doSubmit = React.useCallback(async () => {
      const ok = await validateAll();
      if (!ok) return false;
      setSaving(true);
      try {
        const dto = schema.hooks?.mapToDto ? schema.hooks.mapToDto(values) : values;
        const result = await runSubmit(schema.submit, dto);

        if (schema.hooks?.mapFromDto) {
          const uiVals = schema.hooks.mapFromDto(result);
          if (uiVals && typeof uiVals === "object") setAllValues(uiVals);
        }

        toasts?.success?.(schema.toasts?.saved ?? "Đã lưu thành công");

        // local callback trước
        await Promise.resolve(onSaved?.(result));
        // ✅ schema-level afterSaved
        if (schema.afterSaved) await Promise.resolve(schema.afterSaved(result));

        return true;
      } catch (e: any) {
        toasts?.error?.(schema.toasts?.failed ?? (e?.message || "Lưu thất bại"));
        setErrors((prev) => ({ ...prev, _form: e?.message ?? "" }));
        return false;
      } finally {
        setSaving(false);
      }
    }, [schema, values, validateAll, setAllValues, toasts, onSaved, setErrors]);

    React.useImperativeHandle(ref, () => ({
      submit: doSubmit,
      reset: () => setAllValues(stableInitial),
      values,
    }));

    return (
      <Stack spacing={2}>
        <AutoFormFields
          schema={schema.fields}
          values={values}
          setValue={setValue}
          errors={errors}
        />
      </Stack>
    );
  }
);
