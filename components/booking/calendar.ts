/** Kalender-Hilfen auf Basis von Datums-Schlüsseln "YYYY-MM-DD" (ohne Uhrzeit, ohne Zeitzone). */

export function addDays(key: string, n: number): string {
  const d = new Date(`${key}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export function monthKey(key: string): string {
  return key.slice(0, 7);
}

export function addMonths(month: string, n: number): string {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + n, 1, 12));
  return d.toISOString().slice(0, 7);
}

/** Wochen eines Monats, Montag zuerst. Leere Felder = null. */
export function monthGrid(month: string): (string | null)[][] {
  const [y, m] = month.split("-").map(Number);
  const first = new Date(Date.UTC(y, m - 1, 1, 12));
  const daysInMonth = new Date(Date.UTC(y, m, 0, 12)).getUTCDate();
  const lead = (first.getUTCDay() + 6) % 7; // Montag = 0
  const cells: (string | null)[] = Array.from({ length: lead }, () => null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(`${month}-${String(d).padStart(2, "0")}`);
  while (cells.length % 7) cells.push(null);
  const weeks: (string | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

export function formatMonth(month: string): string {
  return new Intl.DateTimeFormat("de-DE", { month: "long", year: "numeric", timeZone: "UTC" }).format(
    new Date(`${month}-01T12:00:00Z`),
  );
}

export function formatDay(key: string): string {
  return new Intl.DateTimeFormat("de-DE", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }).format(
    new Date(`${key}T12:00:00Z`),
  );
}
