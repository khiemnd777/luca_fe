import { registerTable } from "@core/table/table-registry";
import { createTableSchema, type ColumnDef, type FetchTableOpts } from "@core/table/table.types";
import { openFormDialog } from "@core/form/form-dialog.service";
import type { SectionModel } from "@features/section/model/section.model";
import { table, unlink } from "@features/section/api/section.api";
import { reloadTable } from "@root/core/table/table-reload";

const columns: ColumnDef<SectionModel>[] = [
  { key: "name", header: "Tên phòng ban", sortable: true, labelField: true },
  { key: "description", header: "Mô tả" },
];

registerTable("sections", () =>
  createTableSchema<SectionModel>({
    columns,
    fetch: async (opts: FetchTableOpts) => await table(opts),
    initialPageSize: 10,
    initialSort: { by: "id", dir: "asc" },
    allowUpdating: ["staff.update"],
    allowDeleting: ["staff.delete"],
    onEdit(row) {
      openFormDialog("section", { initial: { id: row.id } });
    },
    async onDelete(row) {
      await unlink(row.id);
      reloadTable("sections");
    },
  })
);
