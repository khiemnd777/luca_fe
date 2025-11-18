import * as React from "react";
import { Stack } from "@mui/material";
import { AutoFormFields } from "@core/form/auto-form-fields";
import { useAutoForm } from "@core/form/use-auto-form";
import type { AutoFormRef, AutoFormProps, SubmitDef, FormSchema, FormMode, ModeText } from "@core/form/form.types";
import { getFormSchema } from "@core/form/form-registry";
import toast from "react-hot-toast";
import type { FieldDef, FieldKind } from "@core/form/types";
import { getAvailableCollection } from "@core/metadata/data/metadata.api";
import type { FieldModel } from "@core/metadata/data/metadata.model";
import { snakeToCamel } from "@root/shared/utils/string.utils";

// metadata
function mapMetadataFieldTypeToFieldKind(t: string): FieldKind {
  switch (t) {
    case "text":
    case "textarea":
      return "text";
    case "number":
      return "number";
    case "currency":
      return "currency";
    case "date":
      return "date";
    case "datetime":
      return "datetime";
    case "boolean":
      return "switch";
    case "select":
      return "select";
    case "multiselect":
      return "multiselect";
    case "image":
      return "imageupload";
    default:
      return "text";
  }
}

async function expandMetadataFields(schemaFields: FieldDef[]): Promise<FieldDef[]> {
  const result: FieldDef[] = [];

  for (const f of schemaFields) {
    if (f.kind !== "metadata" || !f.metadata) {
      result.push(f);
      continue;
    }

    const { collection, mode = "whole", fields, ignoreFields } = f.metadata;
    const coll = await getAvailableCollection(collection, true, false, true);

    let fieldsToUse: FieldModel[] | undefined = coll.fields;
    fieldsToUse = fieldsToUse?.map((f) => ({
      ...f,
      name: snakeToCamel(f.name)
    }));

    const camelIgnores = ignoreFields?.map(snakeToCamel);

    if (mode === "partial" && fields?.length) {
      fieldsToUse = coll.fields?.filter((mf) => fields.includes(mf.name));
    }

    if (mode === "whole" && camelIgnores?.length) {
      fieldsToUse = fieldsToUse?.filter(mf => !camelIgnores.includes(mf.name));
    }

    if (!fieldsToUse) continue;

    for (const mf of fieldsToUse) {
      result.push({
        name: `customFields.${mf.name}`,
        label: mf.label ?? mf.name,
        kind: mapMetadataFieldTypeToFieldKind(mf.type),
        fullWidth: true,
        rules: mf.required ? { required: true } : undefined,
      });
    }
  }

  return result;
}

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

function normalizeCustomFieldsPayload(input: any): any {
  if (!input || typeof input !== "object") return input;

  const dto: Record<string, any> = { ...input };
  const custom: Record<string, any> = dto.custom_fields && typeof dto.custom_fields === "object"
    ? { ...dto.custom_fields }
    : {};

  for (const [key, value] of Object.entries(dto)) {
    if (key.startsWith("custom_fields.")) {
      const fieldName = key.substring("custom_fields.".length);
      custom[fieldName] = value;
      delete dto[key];
    }
  }

  if (Object.keys(custom).length > 0) {
    dto.custom_fields = custom;
  }

  return dto;
}

async function runSubmit(def: SubmitDef, values: Record<string, any>) {
  values = normalizeCustomFieldsPayload(values);

  if (def.type === "fn") {
    return def.run(values);
  }

  const method = def.method ?? "PATCH";
  const fetcher = def.fetcher ?? defaultFetcher;
  let payload = def.transform ? def.transform(values) : values;
  payload = normalizeCustomFieldsPayload(payload);
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

    // metadata
    const [expandedFields, setExpandedFields] = React.useState<FieldDef[]>(schema.fields);
    React.useEffect(() => {
      let cancelled = false;
      async function load() {
        try {
          const expanded = await expandMetadataFields(schema.fields as FieldDef[]);
          if (!cancelled) setExpandedFields(expanded);
        } catch (e) {
          // Nếu lỗi, fallback schema gốc cho an toàn
          if (!cancelled) setExpandedFields(schema.fields as FieldDef[]);
        }
      }
      load();
      return () => {
        cancelled = true;
      };
    }, [schema.fields]);

    // 3) Form state
    const { values, setValue, setAllValues, errors, setErrors, validateAll } = useAutoForm(
      expandedFields,
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
            schema={expandedFields}
            values={values}
            setValue={setValue}
            errors={errors}
          />)
        }
      </Stack>
    );
  }
);
