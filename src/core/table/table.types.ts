// @core/table/table.types.ts
export type SortDir = "asc" | "desc";

export type FetchOpts = {
  page: number;            // 0-based
  size: number;
  orderBy?: string | null;
  direction?: SortDir;
};

export type ColumnType = "text" | "number" | "date" | "color" | "image" | "chips" | "custom";

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
};

export type TableSchema<T> = {
  columns: ColumnDef<T>[];

  /** BẮT BUỘC: fetch server-side (paging + sorting) */
  fetch: (opts: FetchOpts) => Promise<{ items: T[]; total: number }>;

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
  afterReload?: (ctx: FetchOpts & { total: number }) => void | Promise<void>;
};

export function createTableSchema<T>(schema: TableSchema<T>): TableSchema<T> {
  return schema;
}
