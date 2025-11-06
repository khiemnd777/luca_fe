import { registerTable } from "@core/table/table-registry";
import { createTableSchema, type ColumnDef, type FetchTableOpts } from "@core/table/table.types";
import type { RoleModel } from "@features/rbac/model/role.model";
import { fetchRoles } from "@features/rbac/api/role.api";

const columns: ColumnDef<RoleModel>[] = [
  { key: "id", header: "ID", width: 80, sortable: true, stickyLeft: true },
  { key: "roleName", header: "Tên Vai Trò", width: 220, sortable: true, stickyLeft: true },
  { key: "displayName", header: "Hiển Thị", sortable: true },
  { key: "brief", header: "Mô Tả" },
];

registerTable("roles", () =>
  createTableSchema<RoleModel>({
    columns,
    fetch: async (opts: FetchTableOpts) => await fetchRoles(opts),
    initialPageSize: 10,
    initialSort: { by: "id", dir: "asc" },
  })
);
