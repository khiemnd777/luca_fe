import { registerTable } from "@core/table/table-registry";
import { createTableSchema, type ColumnDef, type FetchTableOpts } from "@core/table/table.types";
import { openFormDialog } from "@core/form/form-dialog.service";
import type { DentistModel } from "@features/dentist/model/dentist.model";
import { table, remove } from "@features/dentist/api/dentist.api";
import { reloadTable } from "@core/table/table-reload";

const columns: ColumnDef<DentistModel>[] = [
  { key: "id", header: "ID", width: 80, sortable: true },
  { key: "name", header: "Tên Nha Sĩ", sortable: true, labelField: true },
  { key: "brief", header: "Mô Tả" },
];

registerTable("dentists", () =>
  createTableSchema<DentistModel>({
    columns,
    fetch: async (opts: FetchTableOpts) => await table(opts),
    initialPageSize: 10,
    initialSort: { by: "id", dir: "asc" },
    onEdit(row) {
      openFormDialog("dentist", { initial: { id: row.id } });
    },
    async onDelete(row) {
      await remove(row.id);
      reloadTable("dentists");
    },
  })
);
