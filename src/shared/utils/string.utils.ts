export function snakeToCamel(s: string) {
  return s.replace(/_+([a-zA-Z0-9])/g, (_, c) => c.toUpperCase());
}
export function camelToSnake(s: string) {
  return s
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .replace(/[-\s]+/g, "_")
    .toLowerCase();
}