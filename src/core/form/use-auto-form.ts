// src/core/form/use-auto-form.ts
import * as React from "react";
import type { FieldDef, FieldRules, AutoFormOptions } from "./types";

const emailRegex =
  /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

function getReqMsg(r?: boolean | string) {
  if (!r) return null;
  return typeof r === "string" ? r : "This field is required";
}

type Errors = Record<string, string | null>;

function normalizeErrors(
  obj: Record<string, string | null | undefined>
): Errors {
  const out: Errors = {};
  for (const [k, v] of Object.entries(obj)) out[k] = v ?? null;
  return out;
}

function validateOneSync(
  value: any,
  rules?: FieldRules,
  label?: string,
  kind?: string
): string | null {
  if (!rules) return null;

  // required
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

  // email auto pattern
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

// tiny debounce helper
function debounce<F extends (...args: any[]) => void>(fn: F, ms: number) {
  let t: any;
  return (...args: Parameters<F>) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

export function useAutoForm(
  schema: FieldDef[],
  initial?: Record<string, any>,
  options?: AutoFormOptions
) {
  const asyncDebounceMs = options?.asyncDebounceMs ?? 300;

  const init: Record<string, any> = React.useMemo(() => {
    const obj: Record<string, any> = {};
    for (const f of schema) {
      const fallback =
        f.kind === "currency" ? 0 :
          f.kind === "number" ? 0 :
            f.kind === "checkbox" || f.kind === "switch" ? false :
              f.kind === "multiselect" ? [] :
                f.kind === "fileupload" ? [] :
                  "";
      obj[f.name] = initial?.[f.name] ?? f.defaultValue ?? fallback;
    }
    return obj;
  }, [schema, initial]);

  const [values, setValues] = React.useState<Record<string, any>>(init);
  const [errors, setErrors] = React.useState<Record<string, string | null>>({});
  const [validating, setValidating] = React.useState<Record<string, boolean>>({}); // per-field spinner state

  // public setters
  const setValue = React.useCallback((name: string, v: any) => {
    setValues((s) => ({ ...s, [name]: v }));
  }, []);

  const setFieldError = React.useCallback((name: string, msg: string | null) => {
    setErrors((e) => ({ ...e, [name]: msg }));
  }, []);

  // -------- SYNC VALIDATION (per-form)
  const validate = React.useCallback(() => {
    const err: Record<string, string | null> = {};
    for (const f of schema) {
      const msg = validateOneSync(values[f.name], f.rules, f.label, f.kind);
      if (msg) err[f.name] = msg;
    }
    setErrors(err);
    return Object.values(err).every((x) => !x);
  }, [schema, values]);

  // -------- ASYNC VALIDATION (per-field)
  const validateFieldAsync = React.useCallback(async (name: string) => {
    const def = schema.find((x) => x.name === name);
    if (!def) return true;

    // chạy sync trước
    const syncMsg = validateOneSync(values[name], def.rules, def.label, def.kind);
    if (syncMsg) {
      setFieldError(name, syncMsg);
      return false;
    }
    // nếu không có rules.async → pass
    if (!def.rules?.async) {
      setFieldError(name, null);
      return true;
    }

    // chạy async rule
    try {
      setValidating((v) => ({ ...v, [name]: true }));
      const msg = await def.rules.async(values[name], values);
      setFieldError(name, msg ?? null);
      return !msg;
    } catch (e: any) {
      // phòng trường hợp API lỗi
      setFieldError(name, e?.message ?? "Validation failed");
      return false;
    } finally {
      setValidating((v) => ({ ...v, [name]: false }));
    }
  }, [schema, values, setFieldError]);

  // phiên bản debounced để gọi trong onBlur/onChange nếu muốn
  const validateFieldAsyncDebounced = React.useMemo(() => {
    return debounce((name: string) => {
      validateFieldAsync(name);
    }, asyncDebounceMs);
  }, [validateFieldAsync, asyncDebounceMs]);

  // -------- ASYNC VALIDATION (global)
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
      // Nếu server trả lỗi dạng chung, bạn có thể map về _form key:
      setErrors((er) => ({ ...er, _form: e?.message ?? "Server validation failed" }));
      return false;
    }
  }, [options, values]);

  // -------- VALIDATE ALL (sync + per-field async + global async)
  const validateAll = React.useCallback(async () => {
    // sync trước
    if (!validate()) return false;

    // async từng field có rules.async
    const asyncNames = schema.filter((f) => f.rules?.async).map((f) => f.name);
    const results = await Promise.all(asyncNames.map((n) => validateFieldAsync(n)));
    const okFields = results.every(Boolean);
    if (!okFields) return false;

    // async global
    const okGlobal = await validateAsyncGlobal();
    return okGlobal;
  }, [schema, validate, validateFieldAsync, validateAsyncGlobal]);

  return {
    values,
    setValue,
    errors,
    setErrors,
    setFieldError,
    validating,                      // <- trạng thái đang validate từng field
    validate,                        // sync
    validateFieldAsync,              // validate 1 field (immediate)
    validateFieldAsyncDebounced,     // validate 1 field (debounced)
    validateAll,                     // sync + all async (per-field + global)
    reset: React.useCallback(() => {
      setValues(init);
      setErrors({});
      setValidating({});
    }, [init]),
  };
}
