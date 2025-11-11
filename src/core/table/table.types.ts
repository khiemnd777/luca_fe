import type { ListResult } from "@core/types/list-result";

// @core/table/table.types.ts
export type SortDir = "asc" | "desc";

export type FetchTableOpts = {
  limit: number;            // 0-based
  page: number;
  orderBy?: string | null;
  direction?: SortDir;
};

export type ImageShape = "square" | "circle";

export type ColumnType = "text"
  | "number"
  | "date"
  | "color"
  | "image"
  | "chips"
  | "boolean"
  | "qr"
  | "custom"
  ;

export type QROptions = {
  size?: number;
  tooltipSize?: number;
  level?: "L" | "M" | "Q" | "H";
  fgColor?: string;
  bgColor?: string;
};

export type ColumnDef<T> = {
  key: keyof T | string;
  header: string;
  width?: number | string;
  type?: ColumnType;
  render?: (row: T) => React.ReactNode;

  // Sorting
  sortable?: boolean;
  accessor?: (row: T) => unknown;
  comparator?: (a: T, b: T) => number;

  // Freeze
  stickyLeft?: boolean;
  stickyRight?: boolean;

  // Present for confirm dialog
  labelField?: boolean;
  present?: (row: T) => string;

  // Image
  shape?: ImageShape;

  // QR
  qr?: QROptions;
};

export type TableSchema<T> = {
  columns: ColumnDef<T>[];

  /* Mandatory */
  fetch: (opts: FetchTableOpts) => Promise<ListResult<T>>;

  // UI options
  initialPageSize?: number;                // default 20
  initialSort?: { by: string; dir: SortDir };
  stickyHeader?: boolean;                  // default true
  dense?: boolean;                         // default true
  stickyTopOffset?: number;                // default 0

  // row actions
  onView?: (row: T) => void | Promise<void>;
  onEdit?: (row: T) => void | Promise<void>;
  onDelete?: (row: T) => void | Promise<void>;

  // lifecycle
  afterReload?: (ctx: FetchTableOpts & { total: number }) => void | Promise<void>;
};

export function createTableSchema<T>(schema: TableSchema<T>): TableSchema<T> {
  return schema;
}
