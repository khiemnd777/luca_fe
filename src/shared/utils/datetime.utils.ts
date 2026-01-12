export function formatDateTime(value?: string | null): string {
  if (!value) return "";

  const date = new Date(value);

  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy = date.getFullYear();

  const hh = String(date.getHours()).padStart(2, "0");
  const mi = String(date.getMinutes()).padStart(2, "0");
  const ss = String(date.getSeconds()).padStart(2, "0");

  return `${dd}/${mm}/${yyyy} ${hh}:${mi}:${ss}`;
}

export function formatDate(value?: string | null): string {
  if (!value) return "";

  const date = new Date(value);

  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy = date.getFullYear();

  return `${dd}/${mm}/${yyyy}`;
}

export const fDatetime = "DD/MM/YYYY HH:mm:ss";
export const fDate = "DD/MM/YYYY";

export function serverTimeToClientDate(isoTime: string): Date | null {
  const d = new Date(isoTime);
  if (isNaN(d.getTime())) return null;
  return d;
}


export function serverTimeToClient(
  isoTime: string,
  opts?: {
    withSeconds?: boolean;
    locale?: string;
  }
) {
  const date = serverTimeToClientDate(isoTime);
  if (!date) return "";

  return date.toLocaleString(
    opts?.locale ?? undefined, // undefined = locale của browser
    {
      hour12: false,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: opts?.withSeconds ? "2-digit" : undefined,
    }
  );
}

export function formatTimeAgo(createdAt?: string | number | Date) {
  if (!createdAt) return null;
  const createdMs = new Date(createdAt).getTime();
  if (Number.isNaN(createdMs)) return null;
  const diffMinutes = Math.max(1, Math.floor((Date.now() - createdMs) / 60000));
  if (diffMinutes < 60) return `${diffMinutes} phút trước`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} giờ trước`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays} ngày trước`;
  const diffMonths = Math.floor(diffDays / 30);
  return `${diffMonths} tháng trước`;
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const MS_PER_MONTH = MS_PER_DAY * 30;
const MS_PER_YEAR = MS_PER_DAY * 365;

const toMs = (value?: string | number | Date | null): number | null => {
  if (value == null) return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  const ms = new Date(value).getTime();
  return Number.isNaN(ms) ? null : ms;
};

export function relTime(
  targetOrDiff?: string | number | Date | null,
  base?: string | number | Date | null
): { text: string; color: string } {
  const diffMs = base === undefined
    ? toMs(targetOrDiff)
    : (() => {
      const targetMs = toMs(targetOrDiff);
      const baseMs = toMs(base);
      if (targetMs == null || baseMs == null) return null;
      return targetMs - baseMs;
    })();

  if (diffMs == null) return { text: "", color: "" };

  const absMs = Math.abs(diffMs);
  let value: number;
  let unit: string;

  if (absMs < MS_PER_DAY) {
    value = Math.ceil(absMs / (60 * 60 * 1000));
    unit = "giờ";
  } else if (absMs >= MS_PER_YEAR) {
    value = Math.ceil(absMs / MS_PER_YEAR);
    unit = "năm";
  } else if (absMs >= MS_PER_MONTH) {
    value = Math.ceil(absMs / MS_PER_MONTH);
    unit = "tháng";
  } else {
    value = Math.ceil(absMs / MS_PER_DAY);
    unit = "ngày";
  }

  if (value <= 0) value = 0;

  const isLate = diffMs < 0;
  return {
    text: `${isLate ? "Chậm" : "Còn"} ${value} ${unit}`,
    color: isLate ? "#d32f2f" : "#2e7d32",
  };
}
