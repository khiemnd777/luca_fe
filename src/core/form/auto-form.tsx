import * as React from "react";
import { Stack } from "@mui/material";
import { AutoFormFields } from "@core/form/auto-form-fields";
import { useAutoForm } from "@core/form/use-auto-form";
import type { AutoFormRef, AutoFormProps, SubmitDef } from "@core/form/form.types";
import toast from "react-hot-toast";

const defaultFetcher = (input: string, init: RequestInit) => fetch(input, init);

async function runSubmit(def: SubmitDef, values: Record<string, any>) {
  if (def.type === "fn") return def.run(values);

  const method = def.method ?? "PATCH";
  const fetcher = def.fetcher ?? defaultFetcher;
  let payload: any = values;
  if (def.transform) payload = def.transform(payload);
  const res = await fetcher(def.url, {
    method,
    headers: { "Content-Type": "application/json", ...(def.headers ?? {}) },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try { const j = await res.json(); msg = j?.message || msg; } catch { }
    throw new Error(msg);
  }
  const data = await res.json().catch(() => null);
  return def.parseResponse ? def.parseResponse(data) : data;
}

export const AutoForm = React.forwardRef<AutoFormRef, AutoFormProps>(
  ({ schema, initial, onSaved, notifier }, ref) => {
    // ❗️ Stable empty object khi không truyền initial
    const stableInitial = React.useMemo(() => (initial ?? {}), [initial]);
    const toasts = notifier ?? toast;

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
        const mapToDto = schema.hooks?.mapToDto;
        const dto = mapToDto ? mapToDto(values) : values;
        const result = await runSubmit(schema.submit, dto);

        if (schema.hooks?.mapFromDto) {
          const uiVals = schema.hooks.mapFromDto(result);
          if (uiVals && typeof uiVals === "object") setAllValues(uiVals);
        }
        toasts?.success?.(schema.toasts?.saved ?? "Đã lưu thành công");
        onSaved?.(result);
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
        <AutoFormFields schema={schema.fields} values={values} setValue={setValue} errors={errors} />
      </Stack>
    );
  }
);
