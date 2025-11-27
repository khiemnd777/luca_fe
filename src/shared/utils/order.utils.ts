
// status
const ORDER_STATUSES = [
  { value: "received", label: "Đã nhận đơn" },
  { value: "in_progress", label: "Đang gia công" },
  { value: "qc", label: "Đang kiểm thử" },
  { value: "completed", label: "Đã hoàn thành" },
  { value: "issue", label: "Sự cố" },
  { value: "rework", label: "Làm lại" },
] as const;

const STATUS_LABEL_MAP = ORDER_STATUSES.reduce<Record<string, string>>(
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
