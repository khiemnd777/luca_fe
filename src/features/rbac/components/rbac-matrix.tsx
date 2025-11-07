import {
  Box, Paper, Table, TableHead, TableRow, TableCell, TableBody, Checkbox, CircularProgress, Typography,
  debounce
} from "@mui/material";
import type { MatrixPermission } from "@root/core/network/rbac.types";
import { fetchRBACMatrix, replaceRBAC } from "@features/rbac/api/rbac.api";
import { EV_RBAC_MATRIX_INVALIDATE } from "@features/rbac/model/rbac.events";
import { useEventInvalidation } from "@root/core/module/event-invalidation";

export function RBACMatrix() {
  const { data: matrix, setData, loading, error } = useEventInvalidation<MatrixPermission | null>({
    fetcher: () => fetchRBACMatrix(),
    invalidateEvent: EV_RBAC_MATRIX_INVALIDATE,
    initial: null,
    errorText: "Không thể tải dữ liệu phân quyền",
  });

  const saveRolePermissions = debounce(async (roleId: number, permIds: number[]) => {
    try {
      await replaceRBAC({ roleId, permIds });
    } catch (err) {
      console.error("Failed to update RBAC:", err);
    }
  }, 500);

  const toggle = (rIdx: number, pIdx: number) => {
    setData((prev) => {
      if (!prev) return prev;
      const next = structuredClone(prev);
      const row = next.roles[rIdx];

      row.flags[pIdx] = !row.flags[pIdx];

      const enabledPermIds = next.permissions
        .map((p, idx) => (row.flags[idx] ? p.id : null))
        .filter((id): id is number => id !== null);
      
        saveRolePermissions(row.roleId, enabledPermIds);

      return next;
    });
  };

  if (loading) return <Box p={4} display="flex" justifyContent="center"><CircularProgress /></Box>;
  if (error) return <Box p={4}><Typography color="error">{error}</Typography></Box>;
  if (!matrix) return <Box p={4}><Typography>Không có dữ liệu RBAC Matrix.</Typography></Box>;

  return (
    <Paper>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell sx={{ fontWeight: "bold" }}>Vai trò / Quyền hạn</TableCell>
            {matrix.permissions.map((perm) => (
              <TableCell key={perm.id} align="center" sx={{ fontWeight: "bold" }}>
                {perm.name}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {matrix.roles.map((role, rIdx) => (
            <TableRow key={role.roleId}>
              <TableCell sx={{ fontWeight: 500 }}>{role.displayName}</TableCell>
              {matrix.permissions.map((_, pIdx) => (
                <TableCell key={pIdx} align="center">
                  <Checkbox checked={role.flags[pIdx]} onChange={() => toggle(rIdx, pIdx)} />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Paper>
  );
}
