// src/core/form/use-auto-form.ts
import * as React from "react";
import type { FieldDef, FieldRules, AutoFormOptions } from "./types";

const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

function getReqMsg(r?: boolean | string) {
  if (!r) return null;
  return typeof r === "string" ? r : "This field is required";
}

type Errors = Record<string, string | null>;

function normalizeErrors(obj: Record<string, string | null | undefined>): Errors {
  const out: Errors = {};
  for (const [k, v] of Object.entries(obj)) out[k] = v ?? null;
  return out;
}

function validateOneSync(value: any, rules?: FieldRules, label?: string, kind?: string): string | null {
  if (!rules) return null;

  const reqMsg = getReqMsg(rules.required);
  if (reqMsg) {
    if (typeof value === "boolean") {
      if (!value) return reqMsg;
    } else if (Array.isArray(value)) {
      if (value.length === 0) return reqMsg;
    } else if (value === "" || value === null || value === undefined) {
      return reqMsg;
    }
  }

  if (typeof value === "string") {
    if (rules.minLength != null && value.length < rules.minLength)
      return `${label ?? "This field"} must be at least ${rules.minLength} characters`;
    if (rules.maxLength != null && value.length > rules.maxLength)
      return `${label ?? "This field"} must be at most ${rules.maxLength} characters`;
  }

  if (kind === "email" && value && !emailRegex.test(value)) {
    return "Invalid email format";
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    if (rules.min != null && value < rules.min) return `${label ?? "Value"} must be ≥ ${rules.min}`;
    if (rules.max != null && value > rules.max) return `${label ?? "Value"} must be ≤ ${rules.max}`;
  }

  if (rules.pattern) {
    const { regex, message } =
      rules.pattern instanceof RegExp ? { regex: rules.pattern, message: undefined } : rules.pattern;
    if (typeof value === "string" && !regex.test(value)) {
      return message ?? `${label ?? "Value"} has an invalid format`;
    }
  }

  if (rules.minDateTime && value) {
    if (new Date(value).getTime() < new Date(rules.minDateTime).getTime())
      return `${label ?? "Date"} must be after ${new Date(rules.minDateTime).toLocaleString()}`;
  }
  if (rules.maxDateTime && value) {
    if (new Date(value).getTime() > new Date(rules.maxDateTime).getTime())
      return `${label ?? "Date"} must be before ${new Date(rules.maxDateTime).toLocaleString()}`;
  }

  if (rules.custom) {
    const msg = rules.custom(value);
    if (msg) return msg;
  }
  return null;
}

function debounce<F extends (...args: any[]) => void>(fn: F, ms: number) {
  let t: any;
  return (...args: Parameters<F>) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

// --- Normalize initial values for schema kinds ---
function normalizeInitialBySchema(schema: FieldDef[], raw?: Record<string, any>) {
  const obj: Record<string, any> = {};
  for (const f of schema) {
    const fallback =
      f.kind === "currency" ? 0 :
        f.kind === "number" ? 0 :
          f.kind === "checkbox" || f.kind === "switch" ? false :
            f.kind === "multiselect" ? [] :
              f.kind === "fileupload" ? [] :
                f.kind === "imageupload" ? [] :
                  "";

    let v = raw && f.name in (raw ?? {}) ? raw![f.name] : (f as any).defaultValue ?? fallback;

    switch (f.kind) {
      case "fileupload":
      case "imageupload":
        if (v == null) v = [];
        else if (typeof v === "string") v = [v];
        else if (!Array.isArray(v)) v = [];
        break;
      case "select":
        if (f.multiple) v = Array.isArray(v) ? v : [];
        else if (v == null) v = "";
        break;
      case "multiselect":
        v = Array.isArray(v) ? v : [];
        break;
      case "autocomplete":
        v = v ?? (f.freeSolo ? "" : "");
        break;
      case "datetime":
        if (v == null || v === "") v = "";
        else {
          const d = new Date(v);
          v = isNaN(+d) ? "" : d.toISOString();
        }
        break;
      case "currency":
      case "number":
        if (v == null || v === "") v = 0;
        else {
          const n = Number(v);
          v = Number.isFinite(n) ? n : 0;
        }
        break;
      case "checkbox":
      case "switch":
        v = !!v;
        break;
      case "color":
        v = v ?? "#000000";
        break;
      default:
        if (v == null) v = "";
    }
    obj[f.name] = v;
  }
  return obj;
}

/**
 * AUTO-EXTRAS: Tự động giữ các field không có trong schema (vd: id) vào `values`
 * - Không validate các field này
 * - Tự hydrate khi `initial` đổi
 */
export function useAutoForm(
  schema: FieldDef[],
  initial?: Record<string, any>,
  options?: AutoFormOptions & { hydrateOnInitialChange?: boolean }
) {
  const asyncDebounceMs = options?.asyncDebounceMs ?? 300;
  const hydrateOnInitialChange = options?.hydrateOnInitialChange ?? true;

  const schemaNames = React.useMemo(() => new Set(schema.map(s => s.name)), [schema]);

  // split initial → schemaValues + extras
  const computeInit = React.useCallback(() => {
    const base = normalizeInitialBySchema(schema, initial);
    const extras: Record<string, any> = {};
    if (initial) {
      for (const [k, v] of Object.entries(initial)) {
        if (!schemaNames.has(k)) extras[k] = v; // id, createdAt, ...
      }
    }
    return { base, extras };
  }, [schema, schemaNames, initial]);

  const { base: initBase, extras: initExtras } = React.useMemo(() => computeInit(), [computeInit]);

  const [formValues, setFormValues] = React.useState<Record<string, any>>(initBase); // only schema keys
  const extrasRef = React.useRef<Record<string, any>>(initExtras);                   // non-schema keys
  const [extrasTick, setExtrasTick] = React.useState(0); // trigger rerender when extras change

  const [errors, setErrors] = React.useState<Record<string, string | null>>({});
  const [validating, setValidating] = React.useState<Record<string, boolean>>({});

  // hydrate on initial/schema change
  React.useEffect(() => {
    if (!hydrateOnInitialChange) return;
    const { base, extras } = computeInit();
    setFormValues(base);
    extrasRef.current = extras;
    setExtrasTick((t) => t + 1);
    setErrors({});
    setValidating({});
  }, [computeInit, hydrateOnInitialChange]);

  // public setters
  const setValue = React.useCallback((name: string, v: any) => {
    if (schemaNames.has(name)) {
      setFormValues((s) => ({ ...s, [name]: v }));
    } else {
      // allow setting extra keys (rare)
      extrasRef.current = { ...extrasRef.current, [name]: v };
      setExtrasTick((t) => t + 1);
    }
  }, [schemaNames]);

  const setAllValues = React.useCallback((next: Record<string, any>) => {
    const base: Record<string, any> = {};
    const extras: Record<string, any> = {};
    for (const [k, v] of Object.entries(next)) {
      if (schemaNames.has(k)) base[k] = v;
      else extras[k] = v;
    }
    setFormValues(base);
    extrasRef.current = extras;
    setExtrasTick((t) => t + 1);
  }, [schemaNames]);

  const setFieldError = React.useCallback((name: string, msg: string | null) => {
    setErrors((e) => ({ ...e, [name]: msg }));
  }, []);

  // values = extras + formValues (memoized)
  const values = React.useMemo(
    () => ({ ...extrasRef.current, ...formValues }),
    [formValues, extrasTick]
  );

  // ---- validations (schema fields only)
  const validate = React.useCallback(() => {
    const err: Record<string, string | null> = {};
    for (const f of schema) {
      const msg = validateOneSync(formValues[f.name], f.rules, f.label, f.kind);
      if (msg) err[f.name] = msg;
    }
    setErrors(err);
    return Object.values(err).every((x) => !x);
  }, [schema, formValues]);

  const validateFieldAsync = React.useCallback(async (name: string) => {
    const def = schema.find((x) => x.name === name);
    if (!def) return true;

    const syncMsg = validateOneSync(formValues[name], def.rules, def.label, def.kind);
    if (syncMsg) {
      setFieldError(name, syncMsg);
      return false;
    }
    if (!def.rules?.async) {
      setFieldError(name, null);
      return true;
    }

    try {
      setValidating((v) => ({ ...v, [name]: true }));
      const msg = await def.rules.async(formValues[name], values);
      setFieldError(name, msg ?? null);
      return !msg;
    } catch (e: any) {
      setFieldError(name, e?.message ?? "Validation failed");
      return false;
    } finally {
      setValidating((v) => ({ ...v, [name]: false }));
    }
  }, [schema, formValues, values, setFieldError]);

  const validateFieldAsyncDebounced = React.useMemo(() => {
    return debounce((name: string) => {
      validateFieldAsync(name);
    }, asyncDebounceMs);
  }, [validateFieldAsync, asyncDebounceMs]);

  const validateAsyncGlobal = React.useCallback(async () => {
    if (!options?.asyncValidate) return true;
    try {
      const res = await options.asyncValidate(values);
      if (res && Object.keys(res).length > 0) {
        const normalized = normalizeErrors(res);
        setErrors((e) => ({ ...e, ...normalized }));
        return Object.values(normalized).every((x) => x == null);
      }
      return true;
    } catch (e: any) {
      setErrors((er) => ({ ...er, _form: e?.message ?? "Server validation failed" }));
      return false;
    }
  }, [options, values]);

  const validateAll = React.useCallback(async () => {
    if (!validate()) return false;

    const asyncNames = schema.filter((f) => f.rules?.async).map((f) => f.name);
    const results = await Promise.all(asyncNames.map((n) => validateFieldAsync(n)));
    if (!results.every(Boolean)) return false;

    const okGlobal = await validateAsyncGlobal();
    return okGlobal;
  }, [schema, validate, validateFieldAsync, validateAsyncGlobal]);

  return {
    values,                // <-- luôn chứa cả id (và mọi extras từ initial)
    setValue,
    setAllValues,
    errors,
    setErrors,
    setFieldError,
    validating,
    validate,
    validateFieldAsync,
    validateFieldAsyncDebounced,
    validateAll,
    reset: React.useCallback(() => {
      setFormValues(initBase);
      extrasRef.current = initExtras;
      setExtrasTick((t) => t + 1);
      setErrors({});
      setValidating({});
    }, [initBase, initExtras]),
  };
}
