import * as React from "react";
import { Stack } from "@mui/material";
import { AutoFormFields } from "@core/form/auto-form-fields";
import { useAutoForm } from "@core/form/use-auto-form";
import type { AutoFormRef, AutoFormProps, SubmitDef, FormSchema, FormMode, ModeText } from "@core/form/form.types";
import { getFormSchema } from "@core/form/form-registry";
import toast from "react-hot-toast";

const defaultFetcher = (input: string, init: RequestInit) => fetch(input, init);

function resolveMode(schema: FormSchema, initialVals: any): FormMode {
  const idField = schema.idField ?? "id";
  if (schema.modeResolver) return schema.modeResolver(initialVals ?? {});
  const id = initialVals?.[idField];
  return id !== null && id !== undefined && id !== "" ? "update" : "create";
}

function pickSubmit(schema: FormSchema, mode: FormMode): SubmitDef {
  const s = schema.submit as any;
  if (s?.create && s?.update) return mode === "create" ? s.create : s.update;
  return schema.submit as SubmitDef;
}

function renderModeText(t?: ModeText, ctx?: { mode: FormMode; values: any; result?: any }): string | undefined {
  if (!t) return undefined;
  if (typeof t === "string") return t;
  if (typeof t === "function") return t(ctx!);
  return t[ctx!.mode];
}

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
    try { const j = await res.json(); msg = j?.message || msg; } catch { }
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

    const schema = React.useMemo(() => {
      if (schemaProp) return schemaProp;
      if (name) return getFormSchema(name);
      return null as any;
    }, [schemaProp, name]);

    if (!schema) {
      return <div>Schema {name ? `"${name}"` : ""} chưa được đăng ký.</div>;
    }

    const [resolvedInitial, setResolvedInitial] = React.useState<Record<string, any> | null>(
      initial ?? null
    );

    const [resolvingInitial, setResolvingInitial] = React.useState(false);

    React.useEffect(() => {
      let cancelled = false;
      async function load() {
        setResolvingInitial(true);
        try {
          const resolved = schema.initialResolver
            ? await Promise.resolve(schema.initialResolver(initial))
            : initial;

          const finalInitial =
            initial && resolved && typeof initial === "object" && typeof resolved === "object"
              ? { ...initial, ...resolved }
              : (resolved ?? initial ?? {});

          if (!cancelled) setResolvedInitial(finalInitial);
        } finally {
          if (!cancelled) setResolvingInitial(false);
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
      const initialVals = stableInitial;
      const dto = schema.hooks?.mapToDto ? schema.hooks.mapToDto(values) : values;
      const mode = resolveMode(schema, initialVals);

      try {
        const submitDef = pickSubmit(schema, mode);
        const result = await runSubmit(submitDef, dto);

        if (schema.hooks?.mapFromDto) {
          const uiVals = schema.hooks.mapFromDto(result);
          if (uiVals && typeof uiVals === "object") setAllValues(uiVals);
        }

        const savedMsg = renderModeText(schema.toasts?.saved, { mode, values, result }) ?? "Đã lưu thành công";
        toasts?.success?.(savedMsg);

        await Promise.resolve(onSaved?.(result));
        if (schema.afterSaved) await Promise.resolve(schema.afterSaved(result));

        return true;
      } catch (e: any) {
        const failedMsg =
          renderModeText(schema.toasts?.failed, { mode, values, result: undefined }) ??
          (e?.message || "Lưu thất bại");
        toasts?.error?.(failedMsg);
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
        {resolvingInitial ? (
          <div>Đang tải…</div>
        ) :
          (<AutoFormFields
            schema={schema.fields}
            values={values}
            setValue={setValue}
            errors={errors}
          />)
        }
      </Stack>
    );
  }
);
