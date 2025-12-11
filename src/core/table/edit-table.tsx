import * as React from "react";
import {
  Box,
  Paper,
  Stack,
  Tooltip,
  IconButton,
  Chip,
  TablePagination,
  TableSortLabel,
} from "@mui/material";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import DragIndicatorRoundedIcon from "@mui/icons-material/DragIndicatorRounded";
import QRCode from "react-qr-code";
import type { ColumnDef, ImageShape, SortDir } from "@core/table/table.types";
import { useDisplayUrl } from "@core/photo/use-display-url";
import { camelToSnake } from "@shared/utils/string.utils";
import { formatDate, formatDateTime } from "@root/shared/utils/datetime.utils";
import { NumericFormat } from "react-number-format";
import { DndContext, type DragEndEvent } from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const formatColumnHeader = (label?: string) => label?.toUpperCase();

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

  /** Drag & Drop reorder (client-side) */
  onReorder?: (newRows: T[], from: number, to: number) => void;
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
export function ImageCell(props: { src: string; shape?: ImageShape }) {
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

  const fallbackUrl = `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(
    initialsSeed
  )}`;
  const finalUrl = displayUrl || fallbackUrl;

  const rectW = 48,
    rectH = 36;
  const squareSize = 40;

  const isSquare = shape === "square";
  const isCircle = shape === "circle";

  return (
    <Tooltip
      placement="right"
      componentsProps={{
        tooltip: {
          sx: {
            bgcolor: "transparent",
            p: 0,
            m: 0,
          },
        },
      }}
      title={
        <Box
          component="img"
          src={finalUrl}
          alt="preview"
          sx={{
            width: 200,
            height: "auto",
            objectFit: "contain",
            borderRadius: 1,
            border: "1px solid",
            borderColor: "divider",
            backgroundColor: "background.paper",
          }}
        />
      }
    >
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
          cursor: "pointer",
        }}
      />
    </Tooltip>
  );
}

function QRCell({
  value,
  size = 64,
  tooltipSize = 200,
  level = "M",
  fgColor,
  bgColor,
}: {
  value: string;
  size?: number;
  tooltipSize?: number;
  level?: "L" | "M" | "Q" | "H";
  fgColor?: string;
  bgColor?: string;
}) {
  if (!value) return null;
  const small = (
    <Box
      sx={{
        p: 0.5,
        borderRadius: 1,
        border: "1px solid",
        borderColor: "divider",
        display: "inline-flex",
        bgcolor: bgColor ?? "background.paper",
      }}
    >
      <QRCode value={value} size={size} level={level} fgColor={fgColor} bgColor={bgColor} />
    </Box>
  );

  return (
    <Tooltip
      title={
        <Box sx={{ p: 1, bgcolor: "background.paper", borderRadius: 1, border: "1px solid", borderColor: "divider" }}>
          <QRCode value={value} size={tooltipSize} level={level} fgColor={fgColor} bgColor={bgColor} />
        </Box>
      }
      arrow
      placement="top"
    >
      {small}
    </Tooltip>
  );
}

/* ================= Core ================= */

function getCellValue<T>(row: T, col: ColumnDef<T>) {
  if (col.accessor) return col.accessor(row);
  const k = col.key as string;
  return (row as any)[k];
}

type SortableRowRenderProps = {
  setNodeRef?: (node: HTMLElement | null) => void;
  transformStyle?: React.CSSProperties;
  handleProps?: Omit<React.HTMLAttributes<HTMLElement>, "color">;
  isDragging?: boolean;
};

function SortableRow({
  id,
  disabled,
  children,
}: {
  id: string;
  disabled?: boolean;
  children: (props: SortableRowRenderProps) => React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
    disabled,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <>
      {children({
        setNodeRef,
        transformStyle: style,
        handleProps: { ...attributes, ...listeners } as Omit<React.HTMLAttributes<HTMLElement>, "color">,
        isDragging,
      })}
    </>
  );
}

function defaultCompare(a: unknown, b: unknown) {
  const isDate = (v: unknown) => v instanceof Date || (typeof v === "string" && !isNaN(Date.parse(v)));
  if (typeof a === "number" && typeof b === "number") return a - b;
  if (isDate(a) && isDate(b)) return new Date(a as any).getTime() - new Date(b as any).getTime();
  return String(a ?? "").localeCompare(String(b ?? ""), undefined, { sensitivity: "base" });
}

export function EditTable<T extends { id?: string | number }>({
  rows, columns, page, pageSize, total = null, loading = false,
  onPageChange,
  onPageSizeChange,
  onView,
  onEdit,
  onDelete,
  stickyHeader = true,
  dense = true,
  onSortChange,
  sortBy: controlledSortBy,
  sortDirection: controlledSortDir,
  stickyTopOffset = 0,
  onReorder,
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
    let key = String(col.key);
    key = camelToSnake(key)
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
  const enableDnd = typeof onReorder === "function";
  const dndWidth = 48;
  const baseLeftOffset = (enableDnd ? dndWidth : 0) + (hasActions ? actionsWidth : 0);

  const baseGridTemplateColumns = React.useMemo(() => {
    const parts: string[] = [];
    if (enableDnd) parts.push(`${dndWidth}px`);
    if (hasActions) parts.push(`${actionsWidth}px`);
    columns.forEach((c) => {
      if (typeof c.width === "number") {
        parts.push(`${c.width}px`);
      } else if (typeof c.width === "string") {
        parts.push(c.width);
      } else {
        parts.push("minmax(160px,1fr)");
      }
    });
    return parts.join(" ");
  }, [columns, enableDnd, hasActions]);

  const [syncedGridTemplateColumns, setSyncedGridTemplateColumns] = React.useState(baseGridTemplateColumns);
  const [measuredColumnWidths, setMeasuredColumnWidths] = React.useState<number[] | null>(null);
  const headerRowRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    setSyncedGridTemplateColumns(baseGridTemplateColumns);
  }, [baseGridTemplateColumns]);

  React.useLayoutEffect(() => {
    const headerEl = headerRowRef.current;
    if (!headerEl) return;

    const measure = () => {
      const cells = Array.from(headerEl.children) as HTMLElement[];
      if (!cells.length) return;

      const widths = cells.map((el) => Math.round(el.getBoundingClientRect().width));
      if (!widths.length || widths.some((w) => w === 0)) return;

      const template = widths.map((w) => `${w}px`).join(" ");
      setSyncedGridTemplateColumns((prev) => (prev !== template ? template : prev));

      const startIdx = (enableDnd ? 1 : 0) + (hasActions ? 1 : 0);
      const colWidths = widths.slice(startIdx, startIdx + columns.length);
      setMeasuredColumnWidths((prev) => {
        if (prev && prev.length === colWidths.length && prev.every((v, i) => v === colWidths[i])) {
          return prev;
        }
        return colWidths;
      });
    };

    measure();
    if (typeof ResizeObserver !== "undefined") {
      const observer = new ResizeObserver(() => measure());
      observer.observe(headerEl);
      return () => observer.disconnect();
    }
  }, [columns, enableDnd, hasActions]);

  const resolveColWidth = React.useCallback(
    (col: ColumnDef<T>, idx: number) => {
      const measured = measuredColumnWidths?.[idx];
      if (typeof measured === "number" && measured > 0) return measured;

      if (typeof col.width === "number") return col.width;
      if (typeof col.width === "string") {
        const pxMatch = col.width.match(/([\d.]+)px/);
        if (pxMatch) return parseFloat(pxMatch[1]);
        const numeric = Number(col.width);
        if (!Number.isNaN(numeric)) return numeric;
      }
      return 0;
    },
    [measuredColumnWidths]
  );

  // ==== compute sticky offsets ====
  const leftOffsets: number[] = [];
  const rightOffsets: number[] = [];
  {
    let acc = 0;
    columns.forEach((c, i) => {
      if (c.stickyLeft) {
        const w = resolveColWidth(c, i);
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
        const w = resolveColWidth(c, i);
        rightOffsets[i] = acc;
        acc += isNaN(w) ? 0 : w;
      }
    }
  }

  const gridTemplateColumns = syncedGridTemplateColumns ?? baseGridTemplateColumns;

  const totalColumns = columns.length + (hasActions ? 1 : 0) + (enableDnd ? 1 : 0);

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

  // ==== DnD rows ====
  const [dndRows, setDndRows] = React.useState(sortedRows);
  React.useEffect(() => {
    if (enableDnd) {
      setDndRows(sortedRows);
    }
  }, [sortedRows, enableDnd]);

  const displayRows = enableDnd ? dndRows : sortedRows;

  const rowIds = React.useMemo(
    () => displayRows.map((r, idx) => String((r as any).id ?? idx)),
    [displayRows]
  );

  const handleDragEnd = React.useCallback(
    (event: DragEndEvent) => {
      if (!enableDnd) return;
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      const oldIndex = rowIds.indexOf(String(active.id));
      const newIndex = rowIds.indexOf(String(over.id));
      if (oldIndex === -1 || newIndex === -1) return;
      const newRows = arrayMove(dndRows, oldIndex, newIndex);
      setDndRows(newRows);
      const offset = page * pageSize;
      onReorder?.(newRows, oldIndex + offset, newIndex + offset);
    },
    [enableDnd, rowIds, dndRows, onReorder, page, pageSize]
  );

  // ==== renderers for types (UPDATED color + chips) ====
  const renderCell = (row: T, col: ColumnDef<T>) => {
    if (col.render) return col.render(row);

    const val = getCellValue(row, col);

    switch (col.type) {
      case "color": {
        // string hoặc { color: '#FFF', text?: 'Trắng' }
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
        // Hỗ trợ:
        // - string[] 
        // - number[]
        // - string (có thể dạng "a,b,c" hoặc "a|b|c")
        // - number
        // - object { color?: string; text: string }
        // - array mix
        const toItems = (
          v: any
        ): Array<string | { color?: string; text: string }> => {
          if (Array.isArray(v)) return v as any[];

          if (v == null) return [];

          // object dạng { text, color }
          if (typeof v === "object" && "text" in v) return [v];

          // string: hỗ trợ tách bằng "," hoặc "|"
          if (typeof v === "string") {
            // Trim và split theo , hoặc |
            const parts = v
              .split(/[,|]/g)
              .map((s) => s.trim())
              .filter(Boolean); // loại bỏ rỗng
            return parts;
          }

          // number → convert to string
          if (typeof v === "number") return [String(v)];

          // fallback
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


      case "qr": {
        const s = col.qr?.size ?? 64;
        const tooltipS = col.qr?.tooltipSize ?? 200;
        const level = col.qr?.level ?? "M";
        const fg = col.qr?.fgColor;
        const bg = col.qr?.bgColor;
        const v = String(val ?? "");
        if (!v) return null;
        return <QRCell value={v} size={s} tooltipSize={tooltipS} level={level} fgColor={fg} bgColor={bg} />;
      }

      case "boolean": {
        const v = Boolean(val);
        if (!v) return null;
        return (
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
            <CheckRoundedIcon fontSize="small" color="success" />
          </Box>
        );
      }

      case "date":
        return formatDate(val);
      case "datetime":
        return formatDateTime(val);
      case "currency":
        return (
          <NumericFormat
            value={String(val ?? "")}
            displayType="text"
            thousandSeparator={true}
            prefix={'đ '}
            readOnly={true}
          />
        );
      case "number":
        return (
          <NumericFormat
            value={String(val ?? "")}
            displayType="text"
            thousandSeparator={true}
            readOnly={true}
          />
        );
      case "text":
      default:
        return val as string; //humanize(val as string);
    }
  };

  // TODO: the header cols are not sync width with rows of content below, even crash the last col.
  return (
    <Paper variant="outlined">
      <Box
        sx={{
          overflow: "auto",
          maxHeight: stickyHeader ? 560 : "unset",
        }}
      >
        <Box sx={{ minWidth: "100%" }}>
          <Box
            role="row"
            ref={headerRowRef}
            sx={{
              display: "grid",
              gridTemplateColumns,
              position: stickyHeader ? "sticky" : "static",
              top: stickyHeader ? stickyTopOffset : undefined,
              zIndex: 4,
              backgroundColor: "background.paper",
              borderBottom: "1px solid",
              borderColor: "divider",
            }}
          >
            {enableDnd && (
              <Box
                role="columnheader"
                sx={{
                  position: "sticky",
                  left: 0,
                  zIndex: 6,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  px: 1,
                  py: dense ? 0.75 : 1,
                  backgroundColor: "background.paper",
                  width: dndWidth,
                  minWidth: dndWidth,
                }}
              />
            )}

            {hasActions && (
              <Box
                role="columnheader"
                sx={{
                  position: "sticky",
                  left: enableDnd ? dndWidth : 0,
                  zIndex: 5,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-end",
                  px: 1.5,
                  py: dense ? 0.75 : 1,
                  backgroundColor: "background.paper",
                  whiteSpace: "nowrap",
                  width: actionsWidth,
                  minWidth: actionsWidth,
                }}
              >
                <span></span>
              </Box>
            )}

            {columns.map((c, idx) => {
              const k = String(c.key);
              const sortable = !!c.sortable || !!c.accessor || !!c.comparator;
              const isActive = (controlledSortBy ?? orderBy) === k;
              const dir = (controlledSortDir ?? order) ?? "asc";
              const headerLabel = formatColumnHeader(c.header);

              const left = c.stickyLeft ? baseLeftOffset + (leftOffsets[idx] ?? 0) : undefined;
              const right = c.stickyRight ? (rightOffsets[idx] ?? 0) : undefined;

              return (
                <Box
                  key={k}
                  role="columnheader"
                  sx={{
                    position: (c.stickyLeft || c.stickyRight) ? "sticky" : "static",
                    left,
                    right,
                    zIndex: (c.stickyLeft || c.stickyRight) ? 4 : 3,
                    backgroundColor: "background.paper",
                    px: 1.5,
                    py: dense ? 0.75 : 1,
                    whiteSpace: "nowrap",
                  }}
                >
                  {sortable ? (
                    <TableSortLabel
                      active={isActive}
                      direction={isActive ? dir : "asc"}
                      onClick={() => handleSortClick(c)}
                    >
                      {headerLabel}
                    </TableSortLabel>
                  ) : (
                    headerLabel
                  )}
                </Box>
              );
            })}
          </Box>

          {loading ? (
            <Box
              role="row"
              sx={{
                display: "grid",
                gridTemplateColumns,
                borderBottom: "1px solid",
                borderColor: "divider",
              }}
            >
              <Box
                role="cell"
                sx={{
                  gridColumn: `1 / span ${totalColumns}`,
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  height: "40px",
                  textAlign: "center",
                  px: 2,
                }}
              >
                Đang tải…
              </Box>
            </Box>
          ) : sortedRows.length === 0 ? (
            <Box
              role="row"
              sx={{
                display: "grid",
                gridTemplateColumns,
                borderBottom: "1px solid",
                borderColor: "divider",
              }}
            >
              <Box
                role="cell"
                sx={{
                  gridColumn: `1 / span ${totalColumns}`,
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  height: "40px",
                  textAlign: "center",
                  px: 2,
                }}
              >
                Không có dữ liệu
              </Box>
            </Box>
          ) : (
            (enableDnd ? (
              <DndContext onDragEnd={handleDragEnd}>
                <SortableContext items={rowIds} strategy={verticalListSortingStrategy}>
                  {displayRows.map((r, rowIdx) => {
                    const rowId = rowIds[rowIdx];
                    return (
                      <SortableRow key={rowId} id={rowId}>
                        {({ setNodeRef, transformStyle, handleProps, isDragging }) => (
                          <Box
                            role="row"
                            ref={setNodeRef}
                            sx={{
                              display: "grid",
                              gridTemplateColumns,
                              borderBottom: "1px solid",
                              borderColor: "divider",
                              alignItems: "stretch",
                              backgroundColor: isDragging ? "action.hover" : undefined,
                              "&:hover": {
                                backgroundColor: "action.hover",
                              },
                            }}
                            style={transformStyle}
                          >
                            {/* DnD handle */}
                            <Box
                              role="cell"
                              sx={{
                                position: "sticky",
                                left: 0,
                                zIndex: 3,
                                backgroundColor: "background.paper",
                                width: dndWidth,
                                minWidth: dndWidth,
                                px: 1,
                                py: dense ? 0.75 : 1,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <IconButton
                                size="small"
                                aria-label="Drag to reorder"
                                {...handleProps}
                                sx={{
                                  cursor: isDragging ? "grabbing" : "grab",
                                }}
                              >
                                <DragIndicatorRoundedIcon fontSize="small" />
                              </IconButton>
                            </Box>

                            {/* Actions cell, sticky-left */}
                            {hasActions && (
                              <Box
                                role="cell"
                                sx={{
                                  position: "sticky",
                                  left: enableDnd ? dndWidth : 0,
                                  zIndex: 2,
                                  backgroundColor: "background.paper",
                                  whiteSpace: "nowrap",
                                  width: actionsWidth,
                                  minWidth: actionsWidth,
                                  px: 1.5,
                                  py: dense ? 0.75 : 1,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "flex-end",
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
                              </Box>
                            )}

                            {/* Columns */}
                            {columns.map((c, colIdx) => {
                              const left = c.stickyLeft ? baseLeftOffset + (leftOffsets[colIdx] ?? 0) : undefined;
                              const right = c.stickyRight ? (rightOffsets[colIdx] ?? 0) : undefined;
                              return (
                                <Box
                                  key={String(c.key)}
                                  role="cell"
                                  sx={{
                                    position: (c.stickyLeft || c.stickyRight) ? "sticky" : "static",
                                    left,
                                    right,
                                    zIndex: (c.stickyLeft || c.stickyRight) ? 2 : 1,
                                    backgroundColor: (c.stickyLeft || c.stickyRight) ? "background.paper" : undefined,
                                    whiteSpace: "nowrap",
                                    px: 1.5,
                                    py: dense ? 0.75 : 1,
                                    display: "flex",
                                    alignItems: "center",
                                  }}
                                >
                                  {renderCell(r, c)}
                                </Box>
                              );
                            })}
                          </Box>
                        )}
                      </SortableRow>
                    );
                  })}
                </SortableContext>
              </DndContext>
            ) : (
              sortedRows.map((r, rowIdx) => (
                <Box
                  role="row"
                  key={(r as any).id ?? rowIdx}
                  sx={{
                    display: "grid",
                    gridTemplateColumns,
                    borderBottom: "1px solid",
                    borderColor: "divider",
                    alignItems: "stretch",
                    "&:hover": {
                      backgroundColor: "action.hover",
                    },
                  }}
                >
                  {/* Actions cell, sticky-left */}
                  {hasActions && (
                    <Box
                      role="cell"
                      sx={{
                        position: "sticky",
                        left: 0,
                        zIndex: 2,
                        backgroundColor: "background.paper",
                        whiteSpace: "nowrap",
                        width: actionsWidth,
                        minWidth: actionsWidth,
                        px: 1.5,
                        py: dense ? 0.75 : 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "flex-end",
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
                    </Box>
                  )}

                  {/* Columns */}
                  {columns.map((c, colIdx) => {
                    const left = c.stickyLeft ? baseLeftOffset + (leftOffsets[colIdx] ?? 0) : undefined;
                    const right = c.stickyRight ? (rightOffsets[colIdx] ?? 0) : undefined;
                    return (
                      <Box
                        key={String(c.key)}
                        role="cell"
                        sx={{
                          position: (c.stickyLeft || c.stickyRight) ? "sticky" : "static",
                          left,
                          right,
                          zIndex: (c.stickyLeft || c.stickyRight) ? 2 : 1,
                          backgroundColor: (c.stickyLeft || c.stickyRight) ? "background.paper" : undefined,
                          whiteSpace: "nowrap",
                          px: 1.5,
                          py: dense ? 0.75 : 1,
                          display: "flex",
                          alignItems: "center",
                        }}
                      >
                        {renderCell(r, c)}
                      </Box>
                    );
                  })}
                </Box>
              ))
            ))
          )}
        </Box>
      </Box>

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
