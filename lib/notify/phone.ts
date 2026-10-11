/** Deutsche Handynummer in internationale Schreibweise bringen: 0176 123 → +49176123 */
export function normalizePhone(raw: string): string | null {
  let n = raw.replace(/[\s()/-]/g, "");
  if (n.startsWith("00")) n = `+${n.slice(2)}`;
  else if (n.startsWith("0")) n = `+49${n.slice(1)}`;
  if (!/^\+\d{8,15}$/.test(n)) return null;
  return n;
}
