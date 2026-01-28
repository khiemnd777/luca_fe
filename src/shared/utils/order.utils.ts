
const ORDER_STATUS_PALETTE = [
  "#607d8b", // received - blue gray
  "#1976d2", // in progress - blue
  "#f9a825", // qc - amber
  "#2e7d32", // completed - green
  "#d32f2f", // issue - red
  "#ef6c00", // rework - orange
];

// status
const ORDER_STATUSES = [
  { value: "received", label: "Đã nhận đơn", displayOrder: 1, },
  { value: "in_progress", label: "Đang gia công", displayOrder: 2, },
  { value: "qc", label: "Đang kiểm thử", displayOrder: 3, },
  { value: "issue", label: "Sự cố", displayOrder: 4, },
  { value: "rework", label: "Làm lại", displayOrder: 5, },
  { value: "completed", label: "Đã hoàn thành", displayOrder: 6, },
] as const;

const ORDER_STATUS_HELPERS = [
  { value: "received", label: "Số lượng đơn đã nhận" },
  { value: "in_progress", label: "Số lượng đơn đang được gia công" },
  { value: "qc", label: "Số lượng đơn đang kiểm tra chất lượng" },
  { value: "completed", label: "Số lượng đơn đã hoàn thành" },
  { value: "issue", label: "Số lượng đơn bị sự cố" },
  { value: "rework", label: "Số lượng đơn phải làm lại" },
] as const;

const STATUS_COLOR_MAP = ORDER_STATUSES.reduce<Record<string, string>>(
  (acc, cur, index) => {
    acc[cur.value] = ORDER_STATUS_PALETTE[index] ?? "#9e9e9e";
    return acc;
  },
  {}
);

const STATUS_LABEL_MAP = ORDER_STATUSES.reduce<Record<string, string>>(
  (acc, cur) => {
    acc[cur.value] = cur.label;
    return acc;
  },
  {}
);

const STATUS_DISPLAY_ORDER_MAP = ORDER_STATUSES.reduce<Record<string, number>>(
  (acc, cur) => {
    acc[cur.value] = cur.displayOrder;
    return acc;
  },
  {}
);

const STATUS_HELPER_MAP = ORDER_STATUS_HELPERS.reduce<Record<string, string>>(
  (acc, cur) => {
    acc[cur.value] = cur.label;
    return acc;
  },
  {}
);

export function statusLabel(value?: string | null): string {
  if (!value) return "";
  return STATUS_LABEL_MAP[value] ?? value;
}

export function statusColor(value?: string | null): string {
  if (!value) return "#9e9e9e";
  return STATUS_COLOR_MAP[value] ?? "#9e9e9e";
}

export function statusHelper(value?: string | null): string {
  if (!value) return "";
  return STATUS_HELPER_MAP[value] ?? value;
}

export function statusDisplayOrder(value?: string | null): number {
  if (!value) return 99;
  return STATUS_DISPLAY_ORDER_MAP[value] ?? value;
}

// priority label
const PRIORITY_STATUSES = [
  { value: "normal", label: "Bình thường" },
  { value: "high", label: "Cao" },
  { value: "urgent", label: "Khẩn cấp" },
  { value: "critical", label: "Tối khẩn" },
] as const;

const PRIORITY_LABEL_MAP = PRIORITY_STATUSES.reduce<Record<string, string>>(
  (acc, cur) => {
    acc[cur.value] = cur.label;
    return acc;
  },
  {}
);

export function priorityLabel(value?: string | null): string {
  if (!value) return "";
  return PRIORITY_LABEL_MAP[value] ?? value;
}

// priority color
export const PRIORITY_COLOR_MAP: Record<string, string> = {
  normal: "#9e9e9e", // gray
  high: "#1976d2", // blue
  urgent: "#fb8c00", // orange
  critical: "#d32f2f", // red
};

export function priorityColor(value?: string | null): string {
  if (!value) return "#9e9e9e";
  return PRIORITY_COLOR_MAP[value] ?? "#9e9e9e";
}
