import { registerTable } from "@core/table/table-registry";
import { createTableSchema, type ColumnDef, type FetchTableOpts } from "@core/table/table.types";
import { openFormDialog } from "@core/form/form-dialog.service";
import type { SectionModel } from "@features/staff/model/section.model";
import { fetchSections } from "@features/staff/api/section.api";

const columns: ColumnDef<SectionModel>[] = [
  { key: "id", header: "ID", width: 80, sortable: true },
  { key: "name", header: "Tên Bộ Phận", sortable: true },
  { key: "description", header: "Mô Tả" },
];

registerTable("sections", () =>
  createTableSchema<SectionModel>({
    columns,
    fetch: async (opts: FetchTableOpts) => await fetchSections(opts),
    initialPageSize: 10,
    initialSort: { by: "id", dir: "asc" },
    onEdit(row) {
      openFormDialog("role", { initial: { id: row.id } });
    },
  })
);
