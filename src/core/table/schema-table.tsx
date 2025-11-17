import * as React from "react";
import { EditTable } from "@core/table/edit-table";
import type { TableSchema, SortDir, ColumnDef, ColumnType } from "@core/table/table.types";
import { subscribeTableReload } from "@core/table/table-reload";
import { resolveRowLabel } from "@core/table/table-utils";
import { ConfirmDialog } from "@shared/components/dialog/confirm-dialog";
import { hasAnyPermissions } from "../auth/rbac-utils";
import { getAvailableCollection } from "@core/metadata/data/metadata.api";
import { snakeToCamel } from "@root/shared/utils/string.utils";

async function expandMetadataColumns<T>(columns: ColumnDef<T>[]): Promise<ColumnDef<T>[]> {
  const result: ColumnDef<T>[] = [];

  for (const col of columns) {
    if (col.type !== "metadata" || !col.metadata) {
      result.push(col);
      continue;
    }

    const { collection, mode = "whole", fields, ignoreFields } = col.metadata;
    const schema = await getAvailableCollection(collection, true, true, false);

    let fieldsToUse = schema.fields;
    fieldsToUse = fieldsToUse?.map((f) => ({
      ...f,
      name: snakeToCamel(f.name)
    }));

    const camelIgnores = ignoreFields?.map(snakeToCamel);

    if (mode === "partial" && fields?.length) {
      fieldsToUse = fieldsToUse?.filter(f => fields.includes(f.name));
    }

    if (mode === "whole" && camelIgnores?.length) {
      fieldsToUse = fieldsToUse?.filter(mf => !camelIgnores.includes(mf.name));
    }

    if (fieldsToUse != null) {
      for (const f of fieldsToUse) {
        result.push({
          key: `customFields.${f.name}`,
          header: f.label ?? f.name,
          type: mapFieldTypeToColumnType(f.type),
          accessor: (row: any) => row.customFields?.[f.name],
          sortable: false,
        });
      }
    }
  }

  return result;
}

function mapFieldTypeToColumnType(type: string): ColumnType {
  switch (type) {
    case "text":
    case "textarea":
      return "text";
    case "number":
      return "number";
    case "date":
      return "date";
    case "datetime":
      return "datetime";
    case "boolean":
      return "boolean";
    case "image":
      return "image";
    default:
      return "text";
  }
}

export type SchemaTableRef = { reload: () => void };

type Props<T extends { id?: string | number }> = {
  schema: TableSchema<T>;
  schemaName?: string;
  params?: Record<string, any>;
};

export function ForwardSchemaTable<T extends { id?: string | number }>(
  props: Props<T>,
  ref: React.ForwardedRef<SchemaTableRef>
) {
  const { schema, schemaName, params } = props;

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
        ...params,
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

  const [expandedColumns, setExpandedColumns] = React.useState<ColumnDef<T>[]>(schema.columns);

  React.useEffect(() => {
    let mounted = true;

    (async () => {
      const cols = await expandMetadataColumns(schema.columns);
      if (mounted) setExpandedColumns(cols);
    })();

    return () => {
      mounted = false;
    };
  }, [schema.columns]);

  return (
    <>
      <EditTable<T>
        rows={rows}
        columns={expandedColumns}
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
        onView={hasAnyPermissions(...(schema.allowUpdating ?? [])) ? schema.onView : undefined}
        onEdit={hasAnyPermissions(...(schema.allowUpdating ?? [])) ? schema.onEdit : undefined}
        onDelete={hasAnyPermissions(...(schema.allowDeleting ?? [])) ? (schema.onDelete ? askDelete : undefined) : undefined}
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
