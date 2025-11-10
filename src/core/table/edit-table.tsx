import * as React from "react";
import {
  Box,
  Paper,
  Stack,
  Tooltip,
  IconButton,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TableSortLabel,
} from "@mui/material";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import type { ColumnDef, ImageShape, SortDir } from "@core/table/table.types";
import { useDisplayUrl } from "@core/photo/use-display-url";

export type EditTableProps<T> = {
  rows: T[];
  columns: ColumnDef<T>[];
  page: number;            // 0-based
  pageSize: number;
  total?: number | null;   // nếu có
  loading?: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  onView?: (row: T) => void;
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => void;
  /** Header dính khi scroll dọc */
  stickyHeader?: boolean;
  /** Bảng dense */
  dense?: boolean;

  /** ==== Sorting (server-side optional) ==== */
  onSortChange?: (orderBy: string, direction: SortDir) => void;
  sortBy?: string | null;
  sortDirection?: SortDir;

  /** Khoảng offset top cho header sticky (ví dụ có appbar) */
  stickyTopOffset?: number;
};

/* ================= Helpers: contrast text for background color ================= */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const s = hex.replace("#", "").trim();
  if (![3, 6].includes(s.length)) return null;
  const full = s.length === 3 ? s.split("").map((c) => c + c).join("") : s;
  const n = parseInt(full, 16);
  if (Number.isNaN(n)) return null;
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function srgbToLinear(c: number) {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

function luminance({ r, g, b }: { r: number; g: number; b: number }) {
  const R = srgbToLinear(r), G = srgbToLinear(g), B = srgbToLinear(b);
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

/** Trả về "#000" hoặc "#fff" tuỳ theo độ tương phản tốt hơn với bg */
function getContrastText(bg: string): "#000" | "#fff" {
  const rgb = hexToRgb(bg);
  if (!rgb) return "#000";
  const L = luminance(rgb);
  // Ngưỡng phổ biến: chọn trắng nếu nền tối (L < ~0.5)
  return L > 0.5 ? "#000" : "#fff";
}

/* ================= Components ================= */
function ImageCell(props: { src: string; shape?: ImageShape }) {
  const { src, shape } = props;
  const displayUrl = useDisplayUrl(src);

  let initialsSeed = "user";
  if (src) {
    try {
      const parts = src.split(/[\/\\]/);
      const last = parts[parts.length - 1];
      initialsSeed = last?.split(".")[0] || "user";
    } catch {
      initialsSeed = "user";
    }
  }
  const fallbackUrl = `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(initialsSeed)}`;

  const finalUrl = displayUrl || fallbackUrl;

  const rectW = 48, rectH = 36;
  const squareSize = 40;

  const isSquare = shape === "square";
  const isCircle = shape === "circle";

  return (
    <Box
      component="img"
      src={finalUrl}
      alt=""
      sx={{
        width: isSquare || isCircle ? squareSize : rectW,
        height: isSquare || isCircle ? squareSize : rectH,
        objectFit: "cover",
        borderRadius: isCircle ? "50%" : 0.75,
        border: "1px solid",
        borderColor: "divider",
        backgroundColor: "background.default",
      }}
    />
  );
}


/* ================= Core ================= */

function getCellValue<T>(row: T, col: ColumnDef<T>) {
  if (col.accessor) return col.accessor(row);
  const k = col.key as string;
  return (row as any)[k];
}

function defaultCompare(a: unknown, b: unknown) {
  const isDate = (v: unknown) => v instanceof Date || (typeof v === "string" && !isNaN(Date.parse(v)));
  if (typeof a === "number" && typeof b === "number") return a - b;
  if (isDate(a) && isDate(b)) return new Date(a as any).getTime() - new Date(b as any).getTime();
  return String(a ?? "").localeCompare(String(b ?? ""), undefined, { sensitivity: "base" });
}

export function EditTable<T extends { id?: string | number }>({
  rows, columns, page, pageSize, total = null, loading = false,
  onPageChange, onPageSizeChange, onView, onEdit, onDelete,
  stickyHeader = true, dense = true,
  onSortChange, sortBy: controlledSortBy, sortDirection: controlledSortDir,
  stickyTopOffset = 0,
}: EditTableProps<T>) {

  // ==== sort state (uncontrolled for client-side) ====
  const [orderBy, setOrderBy] = React.useState<string | null>(controlledSortBy ?? null);
  const [order, setOrder] = React.useState<SortDir>(controlledSortDir ?? "asc");

  // sync controlled
  React.useEffect(() => {
    if (controlledSortBy !== undefined) setOrderBy(controlledSortBy);
  }, [controlledSortBy]);
  React.useEffect(() => {
    if (controlledSortDir !== undefined) setOrder(controlledSortDir);
  }, [controlledSortDir]);

  const handleSortClick = (col: ColumnDef<T>) => {
    const key = String(col.key);
    let nextDir: SortDir = "asc";
    if ((controlledSortBy ?? orderBy) === key) {
      nextDir = (controlledSortDir ?? order) === "asc" ? "desc" : "asc";
    }
    if (onSortChange) {
      onSortChange(key, nextDir); // server-side
    } else {
      setOrderBy(key);
      setOrder(nextDir);
    }
  };

  // ==== actions column as first (sticky-left) ====
  const hasActions = Boolean(onView || onEdit || onDelete);
  const actionsWidth = 120;
  const baseLeftOffset = hasActions ? actionsWidth : 0;

  // ==== compute sticky offsets ====
  const leftOffsets: number[] = [];
  const rightOffsets: number[] = [];
  {
    let acc = 0;
    columns.forEach((c, i) => {
      if (c.stickyLeft) {
        const w = typeof c.width === "number" ? c.width : parseInt(String(c.width ?? "0"));
        leftOffsets[i] = acc;
        acc += isNaN(w) ? 0 : w;
      }
    });
  }
  {
    let acc = 0;
    for (let i = columns.length - 1; i >= 0; i--) {
      const c = columns[i];
      if (c.stickyRight) {
        const w = typeof c.width === "number" ? c.width : parseInt(String(c.width ?? "0"));
        rightOffsets[i] = acc;
        acc += isNaN(w) ? 0 : w;
      }
    }
  }

  // ==== client-side sorted rows (only when onSortChange is not provided) ====
  const sortedRows = React.useMemo(() => {
    if (onSortChange || !orderBy) return rows;
    const col = columns.find(c => String(c.key) === orderBy);
    if (!col || (!col.sortable && !col.comparator && !col.accessor)) return rows;
    const arr = [...rows];
    const cmp = col.comparator
      ? (a: T, b: T) => col.comparator!(a, b)
      : (a: T, b: T) => defaultCompare(getCellValue(a, col), getCellValue(b, col));
    arr.sort((a, b) => (order === "asc" ? cmp(a, b) : -cmp(a, b)));
    return arr;
  }, [rows, orderBy, order, onSortChange, columns]);

  // ==== renderers for types (UPDATED color + chips) ====
  const renderCell = (row: T, col: ColumnDef<T>) => {
    if (col.render) return col.render(row);

    const val = getCellValue(row, col);

    switch (col.type) {
      case "color": {
        // Hỗ trợ string hoặc { color: '#FFF', text?: 'Trắng' }
        let color = "";
        let text = "";
        if (typeof val === "string") {
          color = val;
          text = val; // fallback hiển thị mã màu
        } else if (val && typeof val === "object") {
          const v: any = val;
          color = String(v.color ?? "");
          text = String(v.text ?? v.color ?? "");
        }
        const txtColor = getContrastText(color);
        return (
          <Box
            sx={{
              display: "inline-flex",
              alignItems: "center",
              px: 1,
              py: 0.25,
              borderRadius: 1,
              bgcolor: color || "transparent",
              color: color ? txtColor : "text.primary",
              border: "1px solid",
              borderColor: "divider",
              fontSize: 12,
              minHeight: 24,
            }}
          >
            {text}
          </Box>
        );
      }

      case "image": {
        const src = String(val ?? "");
        return <ImageCell src={src} shape={col.shape} />;
      }

      case "chips": {
        // Hỗ trợ: string[] | number[] | string | number | { color?: string; text: string } | Array<...>
        const toItems = (v: any): Array<string | { color?: string; text: string }> => {
          if (Array.isArray(v)) return v as any[];
          if (v == null) return [];
          if (typeof v === "object" && "text" in v) return [v as any];
          return [String(v)];
        };
        const items = toItems(val);

        return (
          <Stack direction="row" spacing={0.5} flexWrap="wrap">
            {items.map((it, idx) => {
              if (typeof it === "string") {
                return <Chip key={idx} size="small" label={it} />;
              }
              // { color?: string; text: string }
              const bg = it.color ?? "";
              const fg = bg ? getContrastText(bg) : undefined;
              return (
                <Chip
                  key={idx}
                  size="small"
                  label={it.text}
                  sx={{
                    bgcolor: bg || undefined,
                    color: fg,
                    border: "1px solid",
                    borderColor: "divider",
                    "& .MuiChip-label": { px: 1 },
                  }}
                />
              );
            })}
          </Stack>
        );
      }

      case "number":
      case "date":
      case "text":
      default:
        return val as any;
    }
  };

  return (
    <Paper variant="outlined">
      <TableContainer sx={{ maxHeight: stickyHeader ? 560 : "unset" }}>
        <Table size={dense ? "small" : "medium"} stickyHeader={stickyHeader}>
          <TableHead>
            <TableRow>
              {hasActions && (
                <TableCell
                  align="right"
                  width={actionsWidth}
                  sx={{
                    position: "sticky",
                    left: 0,
                    zIndex: 3,
                    backgroundColor: "background.paper",
                    top: stickyHeader ? stickyTopOffset : undefined,
                    whiteSpace: "nowrap",
                  }}
                >
                  Actions
                </TableCell>
              )}

              {columns.map((c, idx) => {
                const k = String(c.key);
                const sortable = !!c.sortable || !!c.accessor || !!c.comparator;
                const isActive = (controlledSortBy ?? orderBy) === k;
                const dir = (controlledSortDir ?? order) ?? "asc";

                const left = c.stickyLeft ? baseLeftOffset + (leftOffsets[idx] ?? 0) : undefined;
                const right = c.stickyRight ? (rightOffsets[idx] ?? 0) : undefined;

                return (
                  <TableCell
                    key={k}
                    style={{ width: c.width }}
                    sx={{
                      position: (c.stickyLeft || c.stickyRight) ? "sticky" : "static",
                      left,
                      right,
                      zIndex: (c.stickyLeft || c.stickyRight) ? 3 : 2,
                      backgroundColor: "background.paper",
                      top: stickyHeader ? stickyTopOffset : undefined,
                      whiteSpace: "nowrap",
                    }}
                    sortDirection={isActive ? dir : false}
                  >
                    {sortable ? (
                      <TableSortLabel
                        active={isActive}
                        direction={isActive ? dir : "asc"}
                        onClick={() => handleSortClick(c)}
                      >
                        {c.header}
                      </TableSortLabel>
                    ) : (
                      c.header
                    )}
                  </TableCell>
                );
              })}
            </TableRow>
          </TableHead>

          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={columns.length + (hasActions ? 1 : 0)}>
                  Đang tải…
                </TableCell>
              </TableRow>
            ) : sortedRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length + (hasActions ? 1 : 0)}>
                  Không có dữ liệu
                </TableCell>
              </TableRow>
            ) : (
              sortedRows.map((r, rowIdx) => (
                <TableRow hover key={(r as any).id ?? rowIdx}>
                  {/* Actions cell, sticky-left */}
                  {hasActions && (
                    <TableCell
                      align="right"
                      sx={{
                        position: "sticky",
                        left: 0,
                        zIndex: 1,
                        backgroundColor: "background.paper",
                        whiteSpace: "nowrap",
                        width: actionsWidth,
                        maxWidth: actionsWidth,
                      }}
                    >
                      <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                        {onView && (
                          <Tooltip title="View">
                            <IconButton size="small" onClick={() => onView(r)}>
                              <VisibilityRoundedIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        {onEdit && (
                          <Tooltip title="Edit">
                            <IconButton size="small" onClick={() => onEdit(r)}>
                              <EditRoundedIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        {onDelete && (
                          <Tooltip title="Delete">
                            <IconButton size="small" color="error" onClick={() => onDelete(r)}>
                              <DeleteRoundedIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Stack>
                    </TableCell>
                  )}

                  {/* Columns */}
                  {columns.map((c, colIdx) => {
                    const left = c.stickyLeft ? baseLeftOffset + (leftOffsets[colIdx] ?? 0) : undefined;
                    const right = c.stickyRight ? (rightOffsets[colIdx] ?? 0) : undefined;
                    return (
                      <TableCell
                        key={String(c.key)}
                        sx={{
                          position: (c.stickyLeft || c.stickyRight) ? "sticky" : "static",
                          left,
                          right,
                          zIndex: (c.stickyLeft || c.stickyRight) ? 1 : "auto",
                          backgroundColor: (c.stickyLeft || c.stickyRight) ? "background.paper" : undefined,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {renderCell(r, c)}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Box sx={{ px: 1 }}>
        <TablePagination
          component="div"
          count={total ?? -1}
          page={page}
          onPageChange={(_, p) => onPageChange(p)}
          rowsPerPage={pageSize}
          onRowsPerPageChange={(e) => onPageSizeChange?.(parseInt(e.target.value, 10))}
          rowsPerPageOptions={[10, 20, 50, 100]}
        />
      </Box>
    </Paper>
  );
}
