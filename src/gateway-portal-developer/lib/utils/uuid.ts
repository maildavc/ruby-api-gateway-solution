export function shortId(prefix = "app") {
  const value = Math.random().toString(36).slice(2, 10);
  return `${prefix}_${value}`;
}
