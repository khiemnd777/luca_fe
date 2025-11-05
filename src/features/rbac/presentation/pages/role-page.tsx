import React from "react";
import { Typography, Stack, Paper } from "@mui/material";
import { BasePage } from "@core/pages/base-page";
import type { RoleDto } from "@root/features/rbac/model/role.dto";
import { EditTable, type ColumnDef } from "@shared/components/table/edit-table";
import { fetchRoles } from "@features/rbac/api/role.api";

export default function RolePage() {
  // const nav = useNavigate();

  // paging & data
  const [page, setPage] = React.useState(0); // 0-based
  const [pageSize, setPageSize] = React.useState(20);
  const [rows, setRows] = React.useState<RoleDto[]>([]);
  const [total, setTotal] = React.useState<number | null>(null);
  const [loading, setLoading] = React.useState(false);

  // columns
  const columns = React.useMemo<ColumnDef<RoleDto>[]>(() => [
    { key: "id", header: "ID", width: 80 },
    { key: "roleName", header: "Tên Vai Trò", width: 220 },
    { key: "displayName", header: "Hiển Thị" },
    { key: "brief", header: "Mô Tả" },
  ], []);


  // load data
  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const offset = page * pageSize;
      const { items, total } = await fetchRoles(pageSize, offset);
      setRows(items);
      setTotal(total);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize]);

  React.useEffect(() => {
    load();
  }, [load]);

  // actions
  // const handleView = (r: RoleDto) => nav(`/rbac/roles/${r.id}`);
  // const handleEdit = (r: RoleDto) => nav(`/rbac/roles/${r.id}/edit`);

  // const handleDelete = async (r: RoleDto) => {
  //   const ok = window.confirm(`Delete role "${r.roleName}"?`);
  //   if (!ok) return;
  //   try {
  //     await apiClient.delete(`${env.apiBasePath}/rbac/roles/${r.id}`);
  //   } finally {
  //     await load();
  //   }
  // };

  return (
    <>
      <BasePage>
        <Stack spacing={2}>
          <Typography variant="h5" fontWeight={700} textTransform={"uppercase"}>
            Vai trò
          </Typography>
          <Paper sx={{ p: 2 }}>
            {/* TODO: Implement Role Page Content */}
            <EditTable<RoleDto>
              rows={rows}
              columns={columns}
              page={page}
              pageSize={pageSize}
              total={total}              // nếu server không trả tổng, để null cũng OK
              loading={loading}
              onPageChange={setPage}
              onPageSizeChange={(v) => { setPage(0); setPageSize(v); }}
            // onView={handleView}        // mở trang chi tiết
            // onEdit={handleEdit}        // mở trang chỉnh sửa
            // onDelete={handleDelete}    // xoá rồi reload
            />
          </Paper>
        </Stack>
      </BasePage>
    </>
  );
}
