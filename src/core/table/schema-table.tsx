import * as React from "react";
import { EditTable } from "@core/table/edit-table";
import type { TableSchema, SortDir } from "./table.types";

export type SchemaTableRef = { reload: () => void };

type Props<T extends { id?: string | number }> = {
  schema: TableSchema<T>;
};

export function ForwardSchemaTable<T extends { id?: string | number }>(
  props: Props<T>,
  ref: React.ForwardedRef<SchemaTableRef>
) {
  const { schema } = props;

  const [page, setPage] = React.useState(0);
  const [pageSize, setPageSize] = React.useState(schema.initialPageSize ?? 20);
  const [sortBy, setSortBy] = React.useState<string | null>(schema.initialSort?.by ?? null);
  const [sortDir, setSortDir] = React.useState<SortDir>(schema.initialSort?.dir ?? "asc");

  const [rows, setRows] = React.useState<T[]>([]);
  const [total, setTotal] = React.useState<number>(0);
  const [loading, setLoading] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await schema.fetch({
        page,
        size: pageSize,
        orderBy: sortBy ?? undefined,
        direction: sortDir,
      });
      setRows(res.items ?? []);
      setTotal(res.total ?? 0);
      await Promise.resolve(schema.afterReload?.({
        page,
        size: pageSize,
        orderBy: sortBy ?? undefined,
        direction: sortDir,
        total: res.total ?? 0,
      }));
    } finally {
      setLoading(false);
    }
  }, [schema, page, pageSize, sortBy, sortDir]);

  React.useEffect(() => { load(); }, [load]);

  React.useImperativeHandle(ref, () => ({
    reload: () => load(),
  }));

  return (
    <EditTable<T>
      rows={rows}
      columns={schema.columns}
      page={page}
      pageSize={pageSize}
      total={total}
      loading={loading}
      onPageChange={(p) => setPage(p)}
      onPageSizeChange={(s) => { setPageSize(s); setPage(0); }}

      // sort (server-side)
      onSortChange={(by, dir) => { setSortBy(by); setSortDir(dir); setPage(0); }}
      sortBy={sortBy}
      sortDirection={sortDir}

      // ui
      stickyHeader={schema.stickyHeader ?? true}
      dense={schema.dense ?? true}
      stickyTopOffset={schema.stickyTopOffset ?? 0}

      // actions
      onView={schema.onView}
      onEdit={schema.onEdit}
      onDelete={schema.onDelete}
    />
  );
}

export const SchemaTable = React.forwardRef(ForwardSchemaTable) as
  <T extends { id?: string | number }>(p: Props<T> & { ref?: React.Ref<SchemaTableRef> }) => React.ReactElement;
