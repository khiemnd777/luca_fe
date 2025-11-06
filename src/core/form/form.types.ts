import type { FieldDef } from "@core/form/types";

export type HttpMethod = "POST" | "PUT" | "PATCH" | "DELETE";

export type SubmitHttp = {
  type: "http";
  url: string;
  method?: HttpMethod;
  headers?: Record<string, string>;
  pick?: string[];
  omit?: string[];
  transform?: (values: Record<string, any>) => any;
  parseResponse?: (res: any) => any;
  fetcher?: (input: string, init: RequestInit) => Promise<Response>;
};

export type Notifier = {
  success?: (msg: string) => void;
  error?: (msg: string) => void;
  info?: (msg: string) => void;
};

export type SubmitFn = {
  type: "fn";
  run: (values: Record<string, any>) => Promise<any>;
};

export type SubmitDef = SubmitHttp | SubmitFn;

export type FormHooks = {
  mapToDto?: (values: Record<string, any>) => any;
  mapFromDto?: (dto: any) => Record<string, any>;
  asyncValidate?: (values: Record<string, any>) => Promise<Partial<Record<string, string | null>>>;
  onChange?: (values: Record<string, any>) => void;
};

export type FormMode = "create" | "update";

export type ModeText =
  | string
  | { create: string; update: string }
  | ((ctx: { mode: FormMode; values: any; result?: any }) => string);

export type FormSchema = {
  fields: FieldDef[];
  submit:
  | SubmitDef
  | { create: SubmitDef; update: SubmitDef };
  idField?: string; // mặc định "id"
  modeResolver?: (initial: Record<string, any>) => FormMode;
  hooks?: FormHooks;
  toasts?: {
    saved?: ModeText;   // vd: "Lưu xong!" | { create:"Tạo xong!", update:"Cập nhật xong!" } | (ctx)=>string
    failed?: ModeText;
  };

  showReset?: boolean;
  initialResolver?: () => Promise<Record<string, any> | null> | Record<string, any> | null;
  afterSaved?: (result: any) => Promise<void> | void;
};

export type AutoFormProps = {
  schema?: FormSchema;
  initial?: Record<string, any> | null;
  onSaved?: (result?: any) => void;
  notifier?: Notifier;
};

export type AutoFormRef = {
  submit: () => Promise<boolean>;
  reset: () => void;
  values: Record<string, any>;
};

