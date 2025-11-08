import * as React from "react";
import { EditTable } from "@core/table/edit-table";
import type { TableSchema, SortDir } from "@core/table/table.types";
import { subscribeTableReload } from "@core/table/table-reload";
import { resolveRowLabel } from "@core/table/table-utils";
import { ConfirmDialog } from "@shared/components/dialog/confirm-dialog";

export type SchemaTableRef = { reload: () => void };

type Props<T extends { id?: string | number }> = {
  schema: TableSchema<T>;
  schemaName?: string;
};

export function ForwardSchemaTable<T extends { id?: string | number }>(
  props: Props<T>,
  ref: React.ForwardedRef<SchemaTableRef>
) {
  const { schema, schemaName } = props;

  const [page, setPage] = React.useState(0);
  const [pageSize, setPageSize] = React.useState(schema.initialPageSize ?? 20);
  const [sortBy, setSortBy] = React.useState<string | null>(schema.initialSort?.by ?? null);
  const [sortDir, setSortDir] = React.useState<SortDir>(schema.initialSort?.dir ?? "asc");

  const [rows, setRows] = React.useState<T[]>([]);
  const [total, setTotal] = React.useState<number>(0);
  const [loading, setLoading] = React.useState(false);

  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [confirming, setConfirming] = React.useState(false);
  const [targetRow, setTargetRow] = React.useState<T | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await schema.fetch({
        limit: pageSize,
        page: page,
        orderBy: sortBy ?? undefined,
        direction: sortDir,
      });
      setRows(res.items ?? []);
      setTotal(res.total ?? 0);
      await Promise.resolve(schema.afterReload?.({
        limit: pageSize,
        page: page,
        orderBy: sortBy ?? undefined,
        direction: sortDir,
        total: res.total ?? 0,
      }));
    } finally {
      setLoading(false);
    }
  }, [schema, page, pageSize, sortBy, sortDir]);

  React.useEffect(() => { load(); }, [load]);

  React.useEffect(() => {
    if (!schemaName) return;
    const unsub = subscribeTableReload(schemaName, () => {
      void load();
    });
    return unsub;
  }, [schemaName, load]);

  React.useImperativeHandle(ref, () => ({
    reload: () => load(),
  }));

  const askDelete = React.useCallback((row: T) => {
    if (!schema.onDelete) return;
    setTargetRow(row);
    setConfirmOpen(true);
  }, [schema.onDelete]);

  const handleConfirmDelete = React.useCallback(async () => {
    if (!schema.onDelete || !targetRow) return;
    setConfirming(true);
    try {
      await Promise.resolve(schema.onDelete(targetRow));
      setConfirmOpen(false);
      setTargetRow(null);
      await load();
    } finally {
      setConfirming(false);
    }
  }, [schema.onDelete, targetRow, load]);

  const label = React.useMemo(
    () => (targetRow ? resolveRowLabel(schema.columns, targetRow) : ""),
    [targetRow, schema.columns]
  );

  return (
    <>
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
        onDelete={schema.onDelete ? askDelete : undefined}
      />
      {schema.onDelete && (
        <ConfirmDialog
          open={confirmOpen}
          confirming={confirming}
          onClose={() => { if (!confirming) { setConfirmOpen(false); setTargetRow(null); } }}
          onConfirm={handleConfirmDelete}
          title="Xóa mục này?"
          content={
            label
              ? <>Bạn có chắc muốn xóa&nbsp;<b>{label}</b>&nbsp;không? Hành động này không thể hoàn tác.</>
              : "Bạn có chắc muốn xóa mục này? Hành động này không thể hoàn tác."
          }
          confirmText="Xóa"
          cancelText="Hủy"
        />
      )}
    </>
  );
}

export const SchemaTable = React.forwardRef(ForwardSchemaTable) as
  <T extends { id?: string | number }>(p: Props<T> & { ref?: React.Ref<SchemaTableRef> }) => React.ReactElement;
