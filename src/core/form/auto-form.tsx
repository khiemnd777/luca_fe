import * as React from "react";
import { Stack } from "@mui/material";
import toast from "react-hot-toast";

import { AutoFormFieldsGrouped } from "@core/form/auto-form-fields";
import { useAutoForm } from "@core/form/use-auto-form";

import type {
  AutoFormRef,
  AutoFormProps,
  FormSchema,
  FormMode,
  ModeText,
  SubmitButton,
} from "@core/form/form.types";

import type { FieldDef, FieldKind, FormContext } from "@core/form/types";
import type { FieldModel } from "@core/metadata/data/metadata.model";

import { getFormSchema } from "@core/form/form-registry";
import { getAvailableCollection } from "@core/metadata/data/metadata.api";

import { snakeToCamel } from "@root/shared/utils/string.utils";
import { isJSON, parseJSON } from "@root/shared/utils/json.utils";
import { parseShowIfDependencies } from "@root/shared/metadata/utils";
import { rel1, relM2m, search } from "../relation/relation.api";
import { openFormDialog } from "./form-dialog.service";
import { extractVars } from "@root/shared/utils/equation.utils";
import { parseIntSafe } from "@root/shared/utils/number.utils";
import { packageData } from "./auto-form-package";
import { resolveSubmitButtons } from "./auto-form.helper";

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
    case "relation": return "relation";
    default: return "text";
  }
}

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
    if (deps.length > 0) {
      const prop = metaField.prop;
      const cfPrefix = prop ? `${prop}.` : "";
      deps = deps.map((d) => {
        const camel = snakeToCamel(d);
        if (!camel.startsWith(cfPrefix)) {
          return `${cfPrefix}${camel}`;
        }
        return camel;
      });
    }
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
      const prop = metaField.prop;
      const cfPrefix = prop ? `${prop}.customFields` : `customFields`;
      const fd: FieldDef = {
        prop,
        kind: "currency-equation",
        name: `${cfPrefix}.${mf.name}`,
        label: mf.label ?? mf.name,
        currencyEquation: snakeToCamel(mf.defaultValue ?? ""),
        fullWidth: true,
        group,
      };
      const override = metaField.metadata?.def?.find(d => d.name === mf.name);
      if (override) {
        const { name: _omit, ...rest } = override;
        Object.assign(fd, rest);
      }
      out.push(fd);
      continue;
    }

    if (kind === "select") {
      const prop = metaField.prop;
      const cfPrefix = prop ? `${prop}.customFields` : `customFields`;
      const opts = isJSON(mf.options ?? "") ? parseJSON(mf.options ?? "[]") : [];
      const fd: FieldDef = {
        prop,
        kind: "select",
        name: `${cfPrefix}.${mf.name}`,
        label: mf.label ?? mf.name,
        options: opts,
        fullWidth: true,
        group,
      };
      const override = metaField.metadata?.def?.find(d => d.name === mf.name);
      if (override) {
        const { name: _omit, ...rest } = override;
        Object.assign(fd, rest);
      }
      out.push(fd);
      continue;
    }

    if (kind === "relation") {
      const prop = metaField.prop;
      const relPrefix = prop ? `${prop}.relationFields` : `relationFields`;
      const altPrefix = prop ? `${prop}.customFields` : `customFields`;
      const relation = isJSON(mf.relation ?? "") ? parseJSON(mf.relation ?? "{}") : {};
      const singleChoice = relation.type && relation.type === '1';
      const frmDlgKey = relation.form ?? relation.ref;
      if (singleChoice) {
        const fd: FieldDef = {
          prop,
          kind: "searchsingle",
          name: `${relPrefix}.${mf.name}`,
          altName: `${altPrefix}.${mf.name}`,
          label: mf.label ?? mf.name,
          group,
          placeholder: relation.placeholer ?? "",
          fullWidth: true,
          onSelect: metaField.onSelect,

          getOptionLabel: (d: any) => d?.name,
          getOptionValue: (d: any) => d?.id,

          async searchPage(kw: string, page, limit) {
            const searched = await search(relation.target, {
              keyword: kw,
              page: page,
              limit: limit,
              orderBy: "name",
            });
            return searched.items;
          },

          pageLimit: 20,

          async hydrateByIds(ids: Array<number | string>, values: Record<string, any>) {
            if (!ids || ids.length === 0) return [];
            const refName = `customFields.${mf.name}`;
            const refId = parseIntSafe(values[refName])
            const single = await rel1(relation.target, refId);
            if (!single) return [];
            const items = [single];
            const set = new Set(ids.map(String));
            return (items ?? []).filter((d: any) => set.has(String(d.id)));
          },

          async fetchList(values: Record<string, any>) {
            const refName = `customFields.${mf.name}`;
            const refId = parseIntSafe(values[refName])
            const single = await rel1(relation.target, refId);
            if (!single) return [];
            return [single];
          },

          renderItem: (d: any) => (<>{d?.name}</>),
          disableDelete: (d: any) => d?.locked === true,
          autoLoadAllOnMount: true,
        };
        if (relation.form) {
          fd.onOpenCreate = () => openFormDialog(frmDlgKey);
        }
        const override = metaField.metadata?.def?.find(d => d.name === mf.name);
        if (override) {
          const { name: _omit, ...rest } = override;
          Object.assign(fd, rest);
        }
        out.push(fd);
      } else {

        let fd: FieldDef = {
          prop,
          kind: "searchlist",
          name: `${relPrefix}.${mf.name}`,
          label: mf.label ?? mf.name,
          group,
          placeholder: relation.placeholer ?? "",
          fullWidth: true,
          onSelect: metaField.onSelect,

          getOptionLabel: (d: any) => d?.name,
          getOptionValue: (d: any) => d?.id,

          async searchPage(kw: string, page, limit) {
            const searched = await search(relation.target, {
              keyword: kw,
              page: page,
              limit: limit,
              orderBy: "name",
            });
            return searched.items;
          },

          pageLimit: 20,

          async hydrateByIds(ids: Array<number | string>, values: Record<string, any>) {
            if (!ids || ids.length === 0) return [];
            const table = await relM2m(relation.target, values.id, {
              limit: 10000,
              page: 1,
              orderBy: "name",
            });
            const set = new Set(ids.map(String));
            return (table.items ?? []).filter((d: any) => set.has(String(d.id)));
          },

          async fetchList(values: Record<string, any>) {
            const table = await relM2m(relation.target, values.id, {
              limit: 10000,
              page: 1,
              orderBy: "name",
            });
            return table.items;
          },

          renderItem: (d: any) => (<>{d?.name}</>),
          disableDelete: (d: any) => d?.locked === true,
          onOpenCreate: () => relation.form ? openFormDialog(frmDlgKey) : null,
          autoLoadAllOnMount: true,
        };
        const override = metaField.metadata?.def?.find(d => d.name === mf.name);
        if (override) {
          const { name: _omit, ...rest } = override;
          Object.assign(fd, rest);
        }
        out.push(fd);
      }

      continue;
    }

    const prop = metaField.prop;
    const cfPrefix = prop ? `${prop}.customFields` : `customFields`;
    let fd: FieldDef = {
      prop,
      kind,
      name: `${cfPrefix}.${mf.name}`,
      label: mf.label ?? mf.name,
      fullWidth: true,
      rules: mf.required ? { required: true } : undefined,
      group,
    };
    const override = metaField.metadata?.def?.find(d => d.name === mf.name);
    if (override) {
      const { name: _omit, ...rest } = override;
      Object.assign(fd, rest);
    }
    out.push(fd);
  }

  return { fields: out, deps };
}

/* ========================================================================
   HELPERS
   ======================================================================== */
// const defaultFetcher = (input: string, init: RequestInit) => fetch(input, init);

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

function flattenInitialRecursive(obj: any, prefix: string, out: any) {
  if (!obj || typeof obj !== "object") return;

  // flatten custom_fields → prefix.customFields.*
  if (obj.custom_fields && typeof obj.custom_fields === "object") {
    for (const [k, v] of Object.entries(obj.custom_fields)) {
      const camel = snakeToCamel(k);
      out[`${prefix}.customFields.${camel}`] = v;
    }
  }

  // flatten customFields → prefix.customFields.*
  if (obj.customFields && typeof obj.customFields === "object") {
    for (const [k, v] of Object.entries(obj.customFields)) {
      out[`${prefix}.customFields.${k}`] = v;
    }
  }

  // flatten relation_fields → prefix.relationFields.*
  if (obj.relation_fields && typeof obj.relation_fields === "object") {
    for (const [k, v] of Object.entries(obj.relation_fields)) {
      const camel = snakeToCamel(k);
      out[`${prefix}.relationFields.${camel}`] = v;
    }
  }

  if (obj.relationFields && typeof obj.relationFields === "object") {
    for (const [k, v] of Object.entries(obj.relationFields)) {
      out[`${prefix}.relationFields.${k}`] = v;
    }
  }

  // flatten NORMAL FIELDS: id, code, createdAt, updatedAt, ...
  for (const [k, v] of Object.entries(obj)) {
    // ignore nested groups already handled
    if (k === "custom_fields" || k === "customFields" || k === "relation_fields" || k === "relationFields") continue;

    const camel = snakeToCamel(k);

    // primitive values → flatten to prefix.camel
    if (typeof v !== "object" || v === null) {
      out[`${prefix}.${camel}`] = v;
      continue;
    }

    // nested object → recurse
    flattenInitialRecursive(v, `${prefix}.${camel}`, out);
  }
}

function resolveMode(schema: FormSchema, initialVals: any): FormMode {
  const idField = schema.idField ?? "id";
  if (schema.modeResolver) return schema.modeResolver(initialVals ?? {});
  const id = initialVals?.[idField];
  return id ? "update" : "create";
}

// function pickSubmit(schema: FormSchema, mode: FormMode): SubmitDef {
//   const s = schema.submit as any;
//   if (s?.create && s?.update) return mode === "create" ? s.create : s.update;
//   return schema.submit as SubmitDef;
// }

function renderModeText(
  t?: ModeText,
  ctx?: { mode: FormMode; values: any; result?: any }
): string | undefined {
  if (!t) return undefined;
  if (typeof t === "string") return t;
  if (typeof t === "function") return t(ctx!);
  return t[ctx!.mode];
}

// async function runSubmit(def: SubmitDef, dto: any, meta?: { meta: FieldDef; fields: FieldDef[]; deps: string[] }[]) {
//   if (def.type === "fn") return def.run(dto, meta);

//   const method = def.method ?? "PATCH";
//   const fetcher = def.fetcher ?? defaultFetcher;

//   let payload = def.transform ? def.transform(dto) : dto;

//   const res = await fetcher(def.url, {
//     method,
//     headers: {
//       "Content-Type": "application/json",
//       ...(def.headers ?? {}),
//     },
//     body: JSON.stringify(payload),
//   });

//   if (!res.ok) {
//     let msg = `HTTP ${res.status}`;
//     try {
//       const json = await res.json();
//       msg = json?.message || msg;
//     } catch { }
//     throw new Error(msg);
//   }

//   return res.json().catch(() => null);
// }

function flattenForInitial(obj: any): any {
  const out: any = { ...obj };

  for (const [k, v] of Object.entries(obj ?? {})) {
    if (typeof v === "object" && v !== null) {
      flattenInitialRecursive(v, snakeToCamel(k), out);
    }
  }

  return out;
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
          // FLATTEN ALL NESTED PROPS (custom_fields + relation_fields)
          // ==========================================
          const flattenOut: any = { ...finalInitial };

          for (const [k, v] of Object.entries(finalInitial)) {
            if (typeof v === "object" && v !== null) {
              flattenInitialRecursive(v, snakeToCamel(k), flattenOut)
            }
          }

          if (!cancelled) {
            setResolvedInitial(flattenOut);
            setAllValues(flattenOut);
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
      const out: any = { ...init };

      for (const [k, v] of Object.entries(init)) {
        if (typeof v === "object" && v !== null) {
          flattenInitialRecursive(v, k, out);
        }
      }

      return out;
    }, [stableInitial]);

    React.useEffect(() => {
      setAllValues(fixedInitial);
    }, [fixedInitial]);

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
          if (f.prop) {
            arr.push({
              ...f,
              name: `${f.prop}.${f.name}`
            })
          } else {
            arr.push(f);
          }
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
      // setErrors,
      validateAll,
    } = useAutoForm(baseFields, fixedInitial, {
      asyncValidate: schema.hooks?.asyncValidate,
    });

    // ----------------------------------------------------
    // WRAPPED SETTERS WITH changeSource
    // ----------------------------------------------------
    const setValueUser = (name: string, v: any) => {
      setValue(name, v);  // original
      // schema.onChange?.(name, v, ctxRef.current, "user");
    };

    const setValueProg = (name: string, v: any) => {
      setValue(name, v);  // original
      // schema.onChange?.(name, v, ctxRef.current, "programmatic");
    };

    const setAllValuesProg = (obj: Record<string, any>) => {
      setAllValues(obj);  // original setAllValues
      // schema.onChange?.("*", obj, ctxRef.current, "programmatic");
    };

    // ----------------------------------------------------
    // CTX FOR onChange
    // ----------------------------------------------------
    const ctxRef = React.useRef<FormContext>(null);

    ctxRef.current = {
      values,
      setValue: setValueProg,
      setAllValues: setAllValuesProg,
      reset: () => setAllValuesProg(fixedInitial),
      setInitial: (obj: Record<string, any>) => {
        const flat = flattenForInitial(obj);
        setAllValuesProg(flat);
      },
      clear: () => {
        setAllValuesProg({});
      }
    };

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
            let path = `customFields.${name}`;
            if (f.prop) {
              path = `${f.prop}.${path}`;
            }

            const rVal = values[path];
            if (rVal !== undefined) return rVal;

            if (name in values) return values[name];

            return undefined;
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

    async function handleSubmitButton(btn: SubmitButton, mode: FormMode) {
      const ok = await validateAll();
      if (!ok) return false;

      setSaving(true);

      const packaged = packageData(metadataBlocks, values);
      const dto = schema!.hooks?.mapToDto ? schema!.hooks.mapToDto(packaged) : packaged;

      const ctx = {
        values: dto,
        mode,
        meta: metadataBlocks,
      };

      try {
        const result = await btn.submit(ctx);
        if (schema!.hooks?.mapFromDto) {
          const uiVals = schema!.hooks.mapFromDto(result);
          if (uiVals && typeof uiVals === "object") setAllValues(uiVals);
        }

        toasts.success(
          renderModeText(
            btn.toasts?.saved ?? schema!.toasts?.saved,
            { mode, values, result }
          ) ?? "Đã lưu"
        );

        if (btn.afterSaved) await btn.afterSaved(result);
        if (schema!.afterSaved) await schema!.afterSaved(result);
        if (onSaved) await onSaved(result);

        return true;
      } catch (err: any) {
        toasts.error(
          renderModeText(
            btn.toasts?.failed ?? schema!.toasts?.failed,
            { mode, values }
          ) ?? (err?.message ?? "Lỗi")
        );
        return false;
      } finally {
        setSaving(false);
      }
    }


    /* REF OUTPUT */
    React.useImperativeHandle(ref, () => ({
      submit: () => {
        const mode = resolveMode(schema, stableInitial);
        const buttons = resolveSubmitButtons(schema, mode);
        const primary = buttons[0];
        return handleSubmitButton(primary, mode);
      },
      runSubmitButton: handleSubmitButton,
      getSubmitButtons: () => {
        const mode = resolveMode(schema, stableInitial);
        return resolveSubmitButtons(schema, mode);
      },
      schema,
      values,
      reset: () => setAllValuesProg(fixedInitial),
      setValue: setValueProg,
      setAllValues: setAllValuesProg,
    }));

    /* RENDER SUBMIT BUTTONS */
    // const mode = resolveMode(schema, stableInitial);
    // const submitButtons = resolveSubmitButtons(schema, mode);

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
            setValue={setValueUser}
            errors={errors}
            ctx={ctxRef.current}
          />
        )}

        {/* ======= SUBMIT BUTTONS ======= */}
        {/* <Stack direction="row" spacing={1} justifyContent="flex-end">
          {submitButtons.map((btn) => {
            if (btn.visible && !btn.visible({ values, mode })) return null;
            return (
              <SafeButton
                key={btn.name}
                variant="contained"
                color={btn.color ?? "primary"}
                onClick={() => handleSubmitButton(btn, mode)}
                startIcon={btn.icon}
              >
                {btn.label ?? btn.name}
              </SafeButton>
            );
          })}
        </Stack> */}
      </Stack>
    );
  }
);
