import * as React from "react";
import { Stack } from "@mui/material";
import toast from "react-hot-toast";

import { AutoFormFieldsGrouped } from "@core/form/auto-form-fields";
import { useAutoForm } from "@core/form/use-auto-form";

import type {
  AutoFormRef,
  AutoFormProps,
  SubmitDef,
  FormSchema,
  FormMode,
  ModeText,
} from "@core/form/form.types";

import type { FieldDef, FieldKind } from "@core/form/types";
import type { FieldModel } from "@core/metadata/data/metadata.model";

import { getFormSchema } from "@core/form/form-registry";
import { getAvailableCollection } from "@core/metadata/data/metadata.api";

import { snakeToCamel } from "@root/shared/utils/string.utils";
import { isJSON, parseJSON } from "@root/shared/utils/json.utils";
import { parseShowIfDependencies } from "@root/shared/metadata/utils";
import { rel, search } from "../relation/relation.api";
import { openFormDialog } from "./form-dialog.service";
import { extractVars } from "@root/shared/utils/equation.utils";

/* ========================================================================
   MAP FIELD TYPE
   ======================================================================== */
function mapMetadataFieldTypeToFieldKind(type: string): FieldKind {
  switch (type) {
    case "text": return "text";
    case "textarea": case "richtext": return "textarea";
    case "email": return "email";
    case "number": return "number";
    case "currency": return "currency";
    case "currency_equation": return "currency-equation";
    case "date": return "date";
    case "datetime": return "datetime";
    case "boolean": return "switch";
    case "select": return "select";
    case "multiselect": return "multiselect";
    case "image": return "imageupload";
    case "relation": return "searchlist";
    default: return "text";
  }
}

/* ========================================================================
   EXPAND ONE METADATA BLOCK
   ======================================================================== */
async function expandOneMetadataBlock(
  metaField: FieldDef,
  values: any,
  changedDeps: string[],
): Promise<{ fields: FieldDef[]; deps: string[] }> {
  const { collection, mode = "whole", fields, ignoreFields } = metaField.metadata!;
  const params = changedDeps.map((dep) => ({
    field: dep,
    value: values[dep],
  }));

  const coll = await getAvailableCollection(
    collection,
    true,
    false,
    true,
    values,
    params,
  );

  if (!coll) return { fields: [], deps: [] };

  // parse showIf deps
  let deps: string[] = [];
  if (coll.showIf && isJSON(coll.showIf)) {
    deps = parseShowIfDependencies(coll.showIf);
  }

  let fieldsToUse: FieldModel[] | undefined = coll.fields;
  fieldsToUse = fieldsToUse?.map((mf) => ({
    ...mf,
    name: snakeToCamel(mf.name),
  }));

  const camelIgnores = ignoreFields?.map(snakeToCamel);

  if (mode === "partial" && fields?.length) {
    fieldsToUse = fieldsToUse?.filter((mf) => fields.includes(mf.name));
  }

  if (mode === "whole" && camelIgnores?.length) {
    fieldsToUse = fieldsToUse?.filter((mf) => !camelIgnores.includes(mf.name));
  }

  const out: FieldDef[] = [];

  for (const mf of fieldsToUse ?? []) {
    const kind = mapMetadataFieldTypeToFieldKind(mf.type);
    const group = resolveMetadataFieldGroup(metaField, mf.name);

    if (kind === "currency-equation") {
      out.push({
        kind: "currency-equation",
        name: `customFields.${mf.name}`,
        label: mf.label ?? mf.name,
        currencyEquation: snakeToCamel(mf.defaultValue ?? ""),
        fullWidth: true,
        group,
      });
      continue;
    }

    if (kind === "select") {
      const opts = isJSON(mf.options ?? "") ? parseJSON(mf.options ?? "[]") : [];
      out.push({
        kind: "select",
        name: `customFields.${mf.name}`,
        label: mf.label ?? mf.name,
        options: opts,
        fullWidth: true,
        group,
      });
      continue;
    }

    if (kind === "searchlist") {
      const relation = isJSON(mf.relation ?? "") ? parseJSON(mf.relation ?? "{}") : {};
      const frmDlgKey = relation.form ?? relation.ref;
      out.push({
        kind: "searchlist",
        name: `relationFields.${mf.name}`,
        label: mf.label ?? mf.name,
        group,
        placeholder: relation.placeholer ?? "",
        fullWidth: true,

        getOptionLabel: (d: any) => d.name,
        getOptionValue: (d: any) => d.id,

        async searchPage(kw: string, page, limit) {
          const searched = await search(relation.target, {
            keyword: kw,
            limit: limit,
            page: page,
            orderBy: "name",
          });
          return searched.items;
        },

        pageLimit: 20,

        async hydrateByIds(ids: Array<number | string>, values: Record<string, any>) {
          if (!ids || ids.length === 0) return [];
          const table = await rel(relation.target, values.id, {
            limit: 10000,
            page: 1,
            orderBy: "name",
          });
          const set = new Set(ids.map(String));
          return (table.items ?? []).filter((d: any) => set.has(String(d.id)));
        },

        async fetchList(values: Record<string, any>) {
          const table = await rel(relation.target, values.id, {
            limit: 10000,
            page: 1,
            orderBy: "name",
          });
          return table.items;
        },

        renderItem: (d: any) => (<>{d.name}</>),
        disableDelete: (d: any) => d.locked === true,
        onOpenCreate: () => relation.form ? openFormDialog(frmDlgKey) : null,
        autoLoadAllOnMount: true,
      });

      continue;
    }

    out.push({
      kind,
      name: `customFields.${mf.name}`,
      label: mf.label ?? mf.name,
      fullWidth: true,
      rules: mf.required ? { required: true } : undefined,
      group,
    });
  }

  return { fields: out, deps };
}

/* ========================================================================
   HELPERS
   ======================================================================== */
const defaultFetcher = (input: string, init: RequestInit) => fetch(input, init);

function resolveMetadataFieldGroup(
  metaField: FieldDef,
  fieldName: string
): string {
  const groups = metaField.metadata?.groups;
  if (!groups || groups.length === 0) {
    return metaField.group ?? "general";
  }

  let fallbackGroup: string | null = null;

  for (const g of groups) {
    if (Array.isArray(g.fields) && g.fields.length > 0) {
      if (g.fields.includes(`customFields.${fieldName}`) || g.fields.includes(fieldName)) {
        return g.group;
      }
    }

    if (!g.fields || g.fields.length === 0) {
      fallbackGroup = g.group;
    }
  }

  if (fallbackGroup) return fallbackGroup;

  return metaField.group ?? "general";
}


function resolveMode(schema: FormSchema, initialVals: any): FormMode {
  const idField = schema.idField ?? "id";
  if (schema.modeResolver) return schema.modeResolver(initialVals ?? {});
  const id = initialVals?.[idField];
  return id ? "update" : "create";
}

function pickSubmit(schema: FormSchema, mode: FormMode): SubmitDef {
  const s = schema.submit as any;
  if (s?.create && s?.update) return mode === "create" ? s.create : s.update;
  return schema.submit as SubmitDef;
}

function renderModeText(
  t?: ModeText,
  ctx?: { mode: FormMode; values: any; result?: any }
): string | undefined {
  if (!t) return undefined;
  if (typeof t === "string") return t;
  if (typeof t === "function") return t(ctx!);
  return t[ctx!.mode];
}

function normalizeCustomFieldsPayload(input: any): any {
  if (!input || typeof input !== "object") return input;

  const dto: Record<string, any> = { ...input };
  const custom: any =
    dto.custom_fields && typeof dto.custom_fields === "object"
      ? { ...dto.custom_fields }
      : {};

  for (const [k, v] of Object.entries(dto)) {
    if (k.startsWith("custom_fields.")) {
      const name = k.substring("custom_fields.".length);
      custom[name] = v;
      delete dto[k];
    }
  }

  if (Object.keys(custom).length > 0) dto.custom_fields = custom;
  return dto;
}

function normalizeRelationFieldsToCore(dto: any): any {
  for (const [k, v] of Object.entries(dto)) {
    if (k.startsWith("relation_fields.")) {
      const coreName = k.substring("relation_fields.".length);
      dto[coreName] = v;
      delete dto[k];
    }
  }
  return dto;
}

async function runSubmit(def: SubmitDef, values: any, meta?: { meta: FieldDef; fields: FieldDef[]; deps: string[] }[]) {
  values = normalizeRelationFieldsToCore(values);
  values = normalizeCustomFieldsPayload(values);

  if (def.type === "fn") return def.run(values, meta);

  const method = def.method ?? "PATCH";
  const fetcher = def.fetcher ?? defaultFetcher;

  let payload = def.transform ? def.transform(values) : values;
  payload = normalizeRelationFieldsToCore(payload);
  payload = normalizeCustomFieldsPayload(payload);

  const res = await fetcher(def.url, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(def.headers ?? {}),
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const json = await res.json();
      msg = json?.message || msg;
    } catch { }
    throw new Error(msg);
  }

  return res.json().catch(() => null);
}

/* ========================================================================
   AUTOFORM FINAL
   ======================================================================== */
type Props = AutoFormProps & {
  name?: string;
  notifier?: typeof toast;
};

export const AutoForm = React.forwardRef<AutoFormRef, Props>(
  ({ name, schema: schemaProp, initial, onSaved, notifier }, ref) => {
    const toasts = notifier ?? toast;

    /* LOAD SCHEMA */
    const schema = React.useMemo(() => {
      if (schemaProp) return schemaProp;
      if (name) return getFormSchema(name);
      return null;
    }, [schemaProp, name]);

    if (!schema) return <div>Schema {name} chưa đăng ký.</div>;

    /* RESOLVE INITIAL */
    const [resolvedInitial, setResolvedInitial] = React.useState(initial ?? {});
    const [resolvingInitial, setResolvingInitial] = React.useState(false);

    React.useEffect(() => {
      let cancelled = false;

      (async () => {
        setResolvingInitial(true);
        try {
          const resolved = schema.initialResolver
            ? await schema.initialResolver(initial)
            : initial;

          const finalInitial =
            initial && resolved && typeof initial === "object" && typeof resolved === "object"
              ? { ...initial, ...resolved }
              : resolved ?? initial ?? {};

          // ==========================================
          // FLATTEN customFields.* INTO customFields.*
          // ==========================================
          if (finalInitial?.customFields && typeof finalInitial.customFields === "object") {
            for (const [k, v] of Object.entries(finalInitial.customFields)) {
              const camel = snakeToCamel(k);
              finalInitial[`customFields.${camel}`] = v;
            }
          }

          if (!cancelled) {
            setResolvedInitial(finalInitial);
            setAllValues(finalInitial);
          }
        } finally {
          if (!cancelled) setResolvingInitial(false);
        }
      })();

      return () => { cancelled = true; };
    }, [initial, schema]);

    const stableInitial = resolvedInitial ?? {};

    // --------------------------------------
    // FLATTEN custom_fields vào stableInitial
    // --------------------------------------
    const fixedInitial = React.useMemo(() => {
      const init = { ...stableInitial };

      if (init.customFields && typeof init.customFields === "object") {
        for (const [k, v] of Object.entries(init.customFields)) {
          const camel = snakeToCamel(k);
          init[`customFields.${camel}`] = v;
        }
      }

      return init;
    }, [stableInitial]);

    /* METADATA BLOCKS – PERSISTENT */
    const metadataBlocksRef = React.useRef<
      { meta: FieldDef; fields: FieldDef[]; deps: string[] }[]
    >([]);

    if (metadataBlocksRef.current.length === 0) {
      metadataBlocksRef.current = schema.fields
        .filter((f) => f.kind === "metadata")
        .map((meta) => ({
          meta,
          fields: [],
          deps: [],
        }));
    }

    const metadataBlocks = metadataBlocksRef.current;

    /* FINAL FIELDS*/
    const [metadataVersion, setMetadataVersion] = React.useState(0);

    const finalFields = React.useMemo(() => {
      const arr: FieldDef[] = [];
      const metadataMap = new Map<FieldDef, FieldDef[]>();
      metadataBlocksRef.current.forEach((b) => {
        metadataMap.set(b.meta, b.fields);
      });

      for (const f of schema.fields) {
        if (f.kind === "metadata") {
          const fields = metadataMap.get(f) ?? [];
          arr.push(...fields);
        } else {
          arr.push(f);
        }
      }
      return arr;
    }, [metadataVersion, schema.fields]);

    // ========================================
    // GROUP ENGINE
    // ========================================
    const groupsConfig = schema.groups ?? [{ name: "general", col: 1 }];

    // gom field theo group
    const groupMap = React.useMemo(() => {
      const map = new Map<string, FieldDef[]>();

      // init map theo groupsConfig
      for (const g of groupsConfig) map.set(g.name, []);

      // fallback cho field.group không nằm trong config
      const ensureGroup = (name: string) => {
        if (!map.has(name)) map.set(name, []);
      };

      for (const f of finalFields) {
        const gname = f.group ?? "general";
        ensureGroup(gname);
        map.get(gname)!.push(f);
      }

      return map;
    }, [finalFields, groupsConfig]);


    /* NON-METADATA FIELDS */
    const baseFields = React.useMemo(
      () => schema.fields.filter((f) => f.kind !== "metadata"),
      [schema.fields]
    );

    /* MAIN FORM STATE */
    const {
      values,
      setValue,
      setAllValues,
      errors,
      setErrors,
      validateAll,
    } = useAutoForm(baseFields, fixedInitial, {
      asyncValidate: schema.hooks?.asyncValidate,
    });

    /* SHOW-IF HASH */
    const allDepsRef = React.useRef<string[]>([]);
    const lastDepValuesRef = React.useRef<Record<string, any>>({});

    const showIfHash = React.useMemo(() => {
      const o: any = {};
      for (const d of allDepsRef.current) o[d] = values[d];
      return JSON.stringify(o);
    }, [values]);

    const [, forceUpdate] = React.useReducer((x) => x + 1, 0);

    /* INITIAL EXPAND */
    React.useEffect(() => {
      if (resolvingInitial) return;
      let cancelled = false;

      (async () => {
        const results = await Promise.all(
          metadataBlocks.map((b) => expandOneMetadataBlock(b.meta, values, []))
        );

        if (cancelled) return;

        results.forEach((res, i) => {
          metadataBlocks[i].fields = res.fields;
          metadataBlocks[i].deps = res.deps;
        });
        setMetadataVersion(v => v + 1);

        allDepsRef.current = metadataBlocks.flatMap((b) => b.deps);

        forceUpdate();
      })();

      return () => { cancelled = true; };
    }, [resolvingInitial]);

    // ------------------------------------------------------
    // FORCE INITIAL CHANGED DEPS (very important)
    // ------------------------------------------------------
    const forceInitDoneRef = React.useRef(false);

    React.useEffect(() => {
      if (resolvingInitial) return;
      if (forceInitDoneRef.current) return;

      if (allDepsRef.current.length === 0) return;

      forceInitDoneRef.current = true;

      const initialChanged = [...allDepsRef.current];

      for (const dep of allDepsRef.current) {
        lastDepValuesRef.current[dep] = values[dep];
      }

      (async () => {
        const reloadList = metadataBlocks
          .map((b, i) => ({ b, i }))
          .filter(({ b }) =>
            b.deps.some((d) => initialChanged.includes(d))
          );

        const results = await Promise.all(
          reloadList.map(({ b }) =>
            expandOneMetadataBlock(b.meta, values, initialChanged)
          )
        );

        results.forEach((res, idx) => {
          const actual = reloadList[idx].i;
          metadataBlocks[actual].fields = res.fields;
          metadataBlocks[actual].deps = res.deps;
        });

        allDepsRef.current = metadataBlocks.flatMap((b) => b.deps);
        setMetadataVersion((x) => x + 1);
        forceUpdate();
      })();

    }, [metadataVersion, resolvingInitial]);


    /* HARD ISOLATE RELOAD */
    React.useEffect(() => {
      if (resolvingInitial) return;

      const changedDeps: string[] = [];

      // detect which field changed
      for (const dep of allDepsRef.current) {
        const prev = lastDepValuesRef.current[dep];
        const now = values[dep];
        if (prev !== now) changedDeps.push(dep);
      }

      // update snapshot
      for (const dep of allDepsRef.current) {
        lastDepValuesRef.current[dep] = values[dep];
      }

      if (changedDeps.length === 0) return;

      // find blocks impacted by changedDeps
      const reloadList = metadataBlocks
        .map((b, i) => ({ b, i }))
        .filter(({ b }) => b.deps.some((d) => changedDeps.includes(d)));

      if (reloadList.length === 0) return;

      let cancelled = false;

      (async () => {
        const results = await Promise.all(
          reloadList.map(({ b }) =>
            expandOneMetadataBlock(b.meta, values, changedDeps)
          )
        );

        if (cancelled) return;

        results.forEach((res, idx) => {
          const actual = reloadList[idx].i;
          metadataBlocks[actual].fields = res.fields;
          metadataBlocks[actual].deps = res.deps;
        });
        setMetadataVersion(v => v + 1);

        allDepsRef.current = metadataBlocks.flatMap((b) => b.deps);

        forceUpdate();
      })();

      return () => {
        cancelled = true;
      };
    }, [showIfHash]);

    // ==========================================
    // EQUATION ENGINE
    // ==========================================
    React.useEffect(() => {
      const eqFields = finalFields.filter(f => f.kind === "currency-equation" && f.currencyEquation);
      if (eqFields.length === 0) return;

      for (const f of eqFields) {
        const expr = f.currencyEquation!;
        try {
          const vars = extractVars(expr);

          const argValues = vars.map((name) => {
            if (name in values) return values[name];
            const cf = `customFields.${name}`;
            return values[cf];
          });

          const fn = new Function(...vars, `return (${expr});`);
          let result = fn(...argValues);

          if (!Number.isFinite(result)) result = 0;

          if (values[f.name] !== result) {
            setValue(f.name, result);
          }

        } catch (e) {
          console.error("EQ ERROR:", e);
        }
      }
    }, [values, finalFields]);

    /* SUBMIT */
    const [, setSaving] = React.useState(false);

    const doSubmit = React.useCallback(async () => {
      const ok = await validateAll();
      if (!ok) return false;

      setSaving(true);

      const dto = schema.hooks?.mapToDto
        ? schema.hooks.mapToDto(values)
        : values;

      const mode = resolveMode(schema, stableInitial);

      try {
        const submitDef = pickSubmit(schema, mode);
        const result = await runSubmit(submitDef, dto, metadataBlocks);

        if (schema.hooks?.mapFromDto) {
          const uiVals = schema.hooks.mapFromDto(result);
          if (uiVals && typeof uiVals === "object") setAllValues(uiVals);
        }

        toasts.success(
          renderModeText(schema.toasts?.saved, {
            mode,
            values,
            result,
          }) ?? "Đã lưu thành công"
        );

        if (onSaved) await onSaved(result);
        if (schema.afterSaved) await schema.afterSaved(result);

        return true;
      } catch (e: any) {
        toasts.error(e?.message ?? "Lỗi");
        setErrors((prev) => ({ ...prev, _form: e?.message }));
        return false;
      } finally {
        setSaving(false);
      }
    }, [schema, values]);

    /* REF OUTPUT */
    React.useImperativeHandle(ref, () => ({
      submit: doSubmit,
      reset: () => setAllValues(stableInitial),
      values,
    }));

    /* RENDER */
    return (
      <Stack spacing={2}>
        {resolvingInitial ? (
          <div>Đang tải…</div>
        ) : (
          <AutoFormFieldsGrouped
            groupMap={groupMap}
            groupsConfig={groupsConfig}
            values={values}
            setValue={setValue}
            errors={errors}
          />
        )}
      </Stack>
    );
  }
);
