import { registerTable } from "@core/table/table-registry";
import {
  createTableSchema,
  type ColumnDef,
  type FetchTableOpts,
} from "@core/table/table.types";
import { reloadTable } from "@core/table/table-reload";
import { openFormDialog } from "@core/form/form-dialog.service";

import type { FieldModel } from "@core/metadata/data/metadata.model";
import {
  listFieldsByCollection,
  deleteField,
} from "@core/metadata/data/metadata.api";

const columns: ColumnDef<FieldModel>[] = [
  { key: "orderIndex", header: "Order", width: 60, sortable: true },
  { key: "name", header: "Name", sortable: true, labelField: true },
  { key: "label", header: "Label", sortable: true },
  { key: "type", header: "Type", width: 100 },
  {
    key: "required",
    header: "Required?",
    type: "boolean",
    width: 60,
  },
  {
    key: "unique",
    header: "Unique?",
    type: "boolean",
    width: 70,
  },
];

registerTable('metadata-fields', () =>
  createTableSchema<FieldModel>({
    columns,
    fetch: async (opts: FetchTableOpts & Record<string, any>) => {
      const list = await listFieldsByCollection(opts.collectionId as number);
      return {
        items: list,
        total: list.length,
      };
    },

    initialPageSize: 50,
    initialSort: { by: "orderIndex", dir: "asc" },

    allowUpdating: ["privilege.metadata"],
    allowDeleting: ["privilege.metadata"],

    onEdit(row) {
      openFormDialog("metadata-field", {
        initial: { ...row },
      });
    },

    async onDelete(row) {
      await deleteField(row.id);
      reloadTable('metadata-fields');
    },
  })
);
