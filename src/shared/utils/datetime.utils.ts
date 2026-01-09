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
