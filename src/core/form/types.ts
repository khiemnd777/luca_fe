export type FieldKind =
  | "text"
  | "password"
  | "new-password"
  | "change-password"
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
  | "imageupload"
  | "custom"
  | "searchlist";

export type DeriveMode = "always" | "whenEmpty" | "untilManual";

// Password rules
export type PasswordRules = {
  minLength?: number;          // default 8
  maxLength?: number;          // optional
  requireUpper?: boolean;      // default true
  requireLower?: boolean;      // default true
  requireDigit?: boolean;      // default true
  requireSymbol?: boolean;     // default false
  disallowSpaces?: boolean;    // default true
  disallowReuseCurrent?: boolean; // chỉ áp cho change-password, default true
  custom?: (pw: string, allValues: Record<string, any>) => string | null | undefined;
};

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

// searchlist
export type SearchListSearchFn = (keyword: string) => Promise<any[]>;
export type SearchListSearchPageFn = (keyword: string, page: number, limit: number) => Promise<any[]>;
export type SearchListFetchListFn = (values: Record<string, any>) => Promise<any[]>;
export type SearchListHydrateFn = (
  ids: Array<string | number>,
  values: Record<string, any>
) => Promise<any[]>;

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

  // fileupload | imageupload
  accept?: string;                                      // ví dụ: "image/*,.pdf"
  uploader?: (files: File[]) => Promise<string[]>;      // trả về URLs sau upload
  maxFiles?: number;
  multipleFiles?: boolean;                              // nếu không set, suy ra từ rules.required hoặc defaultValue

  // password
  passwordRules?: PasswordRules;
  // change-password labels
  currentLabel?: string;  // default: "Mật khẩu hiện tại"
  newLabel?: string;      // default: "Mật khẩu mới" (hoặc "Mật khẩu" cho new-password)
  confirmLabel?: string;  // default: "Xác nhận mật khẩu mới" / "Xác nhận mật khẩu"

  // custom
  render?: (ctx: CustomRenderCtx) => React.ReactNode;

  // derive value từ field khác (vd: fullname -> slug)
  derive?: {
    /** Field nguồn (vd: "fullname") */
    field: string;
    /** Ánh xạ từ giá trị nguồn -> giá trị đích */
    map: (sourceValue: any, values: Record<string, any>) => any;
    /** Cơ chế ghi đè:
     *  - "always": luôn sync theo nguồn
     *  - "whenEmpty": chỉ điền nếu hiện đang rỗng
     *  - "untilManual": tự động cho đến khi người dùng chỉnh tay field đích
     **/
    mode?: DeriveMode; // default: "untilManual"
  };

  // searchlist
  search?: SearchListSearchFn;                                   // search(kw): T[]
  searchPage?: SearchListSearchPageFn;                           // searchPage(kw, page, limit): T[]
  fetchList?: SearchListFetchListFn;                             // hydrate list hiện có theo ngữ cảnh (values): T[]
  hydrateByIds?: SearchListHydrateFn;                            // map IDs -> T[] khi field đã có sẵn IDs

  onAdd?: (item: any) => Promise<void> | void;                   // khi add item từ search
  onDelete?: (item: any) => Promise<void> | void;

  // Extractors (áp dụng cho searchlist)
  getOptionLabel?: (item: any) => string;                        // T -> label
  getOptionValue?: (item: any) => string | number;               // T -> ID

  // UI render item (không chứa nút delete)
  renderItem?: (item: any, index: number) => React.ReactNode;

  // Behavior
  allowDuplicate?: boolean;                                      // default false (ẩn item đã chọn)
  dedupeFn?: (a: any, b: any) => boolean;                        // custom so sánh
  maxItems?: number;
  disableDelete?: (item: any) => boolean;
  
  // Create flow via FormDialog
  onOpenCreate?: () => void;                                     // mở FormDialog tạo mới
  refreshKey?: any;                                              // trigger refetch list hiện có
  autoLoadAllOnMount?: boolean;                                  // rỗng → load ALL ngay từ mount (default false)
  pageLimit?: number;
};

// tuỳ chọn cho hook, gồm global async validate
export type AutoFormOptions = {
  // Validate server-level toàn form (ví dụ: conflict nhiều field)
  // Return mảng lỗi theo field name.
  asyncValidate?: (values: Record<string, any>) => Promise<Partial<Record<string, string | null>>>;
  // Debounce khi validate async theo field (ms). Mặc định 300.
  asyncDebounceMs?: number;
};
