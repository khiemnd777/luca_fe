// @features/rbac/role.table.ts
import { registerTable } from "@core/table/table-registry";
import { createTableSchema, type ColumnDef, type FetchOpts } from "@core/table/table.types";
// NOTE: đổi path đúng với API của bạn
import type { RoleModel } from "@features/rbac/model/role.model";
import { fetchRoles } from "@features/rbac/api/role.api";
// kỳ vọng: fetchRoles({ limit, offset, orderBy, direction }) => Promise<{ items: RoleModel[]; total: number | null }>


// ========= Columns =========
const columns: ColumnDef<RoleModel>[] = [
  { key: "id", header: "ID", width: 80, sortable: true, stickyLeft: true },
  { key: "roleName", header: "Tên Vai Trò", width: 220, sortable: true, stickyLeft: true },
  { key: "displayName", header: "Hiển Thị", sortable: true },
  { key: "brief", header: "Mô Tả" },
];

// ========= Fetch adaptor (server-side paging + sorting) =========
async function fetchRolePage(opts: FetchOpts): Promise<{ items: RoleModel[]; total: number }> {
  const { page, size } = opts;
  const offset = page * size;
  const res = await fetchRoles(size, offset);
  return { items: res.items ?? [], total: res.total ?? (res.items?.length ?? 0) };
}

// ========= Register table =========
registerTable("roles", () =>
  createTableSchema<RoleModel>({
    columns,
    fetch: fetchRolePage,
    initialPageSize: 20,
    initialSort: { by: "id", dir: "asc" },
    stickyHeader: true,
    dense: true,
    stickyTopOffset: 0,

    // onView: (r) => navigate(`/rbac/roles/${r.id}`),
    // onEdit: (r) => openEditDialog(r),
    // onDelete: async (r) => await deleteRole(r.id),

    // afterReload: ({ page, size, orderBy, direction, total }) => {
    //   console.debug("roles reloaded", { page, size, orderBy, direction, total });
    // },
  })
);
