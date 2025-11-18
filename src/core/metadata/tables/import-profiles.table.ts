import { registerTable } from "@core/table/table-registry";
import {
  createTableSchema,
  type ColumnDef,
  type FetchTableOpts,
} from "@core/table/table.types";
import { navigate } from "@core/navigation/navigate";
import { reloadTable } from "@core/table/table-reload";

import type { ImportFieldProfileModel } from "@core/metadata/data/import.model";
import {
  listImportProfiles,
  deleteImportProfile,
} from "@core/metadata/data/import.api";

// Tạm để rỗng, bạn có thể thêm columns sau cho scope/code/name/isDefault
const columns: ColumnDef<ImportFieldProfileModel>[] = [
  { key: "scope", header: "Scope" },
  { key: "code", header: "Code" },
  { key: "name", header: "Name" },
  { key: "isDefault", header: "Default", type: "boolean" },
];

registerTable(
  "import-profiles", () =>
  createTableSchema<ImportFieldProfileModel>({
    columns,

    async fetch(opts: FetchTableOpts & Record<string, any>) {
      const scope = (opts.scope as string | undefined) ?? "";
      const items = await listImportProfiles(scope ? { scope } : {});
      return {
        items,
        total: items.length,
      };
    },

    allowUpdating: ["privilege.metadata"],
    allowDeleting: ["privilege.metadata"],

    onEdit(row) {
      navigate(`/import-profiles/mapping/${row.id}`);
    },

    async onDelete(row) {
      await deleteImportProfile(row.id);
      reloadTable("import-profiles");
    },
  })
);
