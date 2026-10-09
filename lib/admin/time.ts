import { TZDate } from "@date-fns/tz";

/** Datum + Uhrzeit aus einem Formular (Ortszeit des Studios) → echter Zeitpunkt */
export function localToDate(date: string, time: string, timezone: string): Date | null {
  const d = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  const t = /^(\d{2}):(\d{2})$/.exec(time);
  if (!d || !t) return null;
  const result = new TZDate(Number(d[1]), Number(d[2]) - 1, Number(d[3]), Number(t[1]), Number(t[2]), timezone);
  return new Date(result.getTime());
}

/** Zeitpunkt → { date: "YYYY-MM-DD", time: "HH:MM" } in Ortszeit (für Formularfelder) */
export function dateToLocal(at: Date | string, timezone: string) {
  const d = TZDate.tz(timezone, typeof at === "string" ? Date.parse(at) : at.getTime());
  const pad = (n: number) => String(n).padStart(2, "0");
  return {
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
  };
}

/** Beginn und Ende eines Ortstages als Zeitpunkte (für Datenbankabfragen) */
export function dayRange(date: string, timezone: string): { from: Date; to: Date } | null {
  const from = localToDate(date, "00:00", timezone);
  if (!from) return null;
  const [y, m, d] = date.split("-").map(Number);
  const next = new TZDate(y, m - 1, d + 1, 0, 0, timezone);
  return { from, to: new Date(next.getTime()) };
}

/** Montag der Woche eines Datums (YYYY-MM-DD) */
export function mondayOf(date: string): string {
  const d = new Date(`${date}T12:00:00Z`);
  const offset = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - offset);
  return d.toISOString().slice(0, 10);
}
