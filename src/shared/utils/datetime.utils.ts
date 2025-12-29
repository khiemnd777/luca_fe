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
