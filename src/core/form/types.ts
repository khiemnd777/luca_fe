export type FieldKind =
  | "text"
  | "password"
  | "email"
  | "textarea"
  | "datetime"
  | "color"
  | "currency"
  | "select"
  | "checkbox"
  | "switch"
  | "number"
  | "multiselect"
  | "autocomplete"
  | "fileupload"
  | "custom";
;

export type FieldRules = {
  required?: boolean | string; // true | "custom message"
  minLength?: number;
  maxLength?: number;
  min?: number; // number/currency
  max?: number; // number/currency
  pattern?: RegExp | { regex: RegExp; message?: string };
  minDateTime?: string; // ISO string
  maxDateTime?: string; // ISO string
  custom?: (value: any) => string | null | undefined; // sync: return message if invalid
  
  // async validation (per-field)
  // Trả về message lỗi hoặc null/undefined nếu hợp lệ.
  async?: (value: any, allValues: Record<string, any>) => Promise<string | null | undefined>;

};

export type Option = {
  label: string;
  value: string | number | boolean;
};

export type CustomRenderCtx = {
  value: any;
  setValue: (v: any) => void;
  error?: string | null;
  field: FieldDef;
};

export type FieldDef = {
  name: string;
  label: string;
  kind: FieldKind;
  placeholder?: string;
  rows?: number;                                        // for textarea
  defaultValue?: any;
  helperText?: string;
  fullWidth?: boolean;
  size?: "small" | "medium";
  rules?: FieldRules;
  step?: number;                                        // for number

  // select / multiselect / autocomplete
  options?: Option[];                                   // for select
  loadOptions?: (keyword: string) => Promise<Option[]>; // async loader cho autocomplete
  freeSolo?: boolean;                                   // autocomplete free text
  multiple?: boolean;                                   // multiselect flag

  // fileupload
  accept?: string;                                      // ví dụ: "image/*,.pdf"
  uploader?: (files: File[]) => Promise<string[]>;      // trả về URLs sau upload
  maxFiles?: number;
  multipleFiles?: boolean;                              // nếu không set, suy ra từ rules.required hoặc defaultValue

  // custom
  render?: (ctx: CustomRenderCtx) => React.ReactNode;
};

// tuỳ chọn cho hook, gồm global async validate
export type AutoFormOptions = {
  // Validate server-level toàn form (ví dụ: conflict nhiều field)
  // Return mảng lỗi theo field name.
  asyncValidate?: (values: Record<string, any>) => Promise<Partial<Record<string, string | null>>>;
  // Debounce khi validate async theo field (ms). Mặc định 300.
  asyncDebounceMs?: number;
};
