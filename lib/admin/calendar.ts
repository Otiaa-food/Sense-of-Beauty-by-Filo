import { addDays } from "@/components/booking/calendar";
import { dateToLocal, mondayOf } from "@/lib/admin/time";

/** Kalender-Hilfen für das Admin (reine Funktionen, gut testbar) */

export type View = "tag" | "woche" | "monat";

export function parseView(v?: string): View {
  return v === "tag" || v === "monat" ? v : "woche";
}

/** 6 Wochen (42 Tage) ab dem Montag vor dem Monatsersten: ein volles Monatsraster */
export function monthCells(month: string): string[] {
  const start = mondayOf(`${month}-01`);
  return Array.from({ length: 42 }, (_, i) => addDays(start, i));
}

/** Tage, die eine Ansicht zeigt */
export function daysForView(view: View, day: string): string[] {
  if (view === "tag") return [day];
  if (view === "monat") return monthCells(day.slice(0, 7));
  const monday = mondayOf(day);
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}

/** Vor/zurück je nach Ansicht */
export function shiftDay(view: View, day: string, dir: 1 | -1): string {
  if (view === "tag") return addDays(day, dir);
  if (view === "woche") return addDays(day, 7 * dir);
  const [y, m] = day.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + dir, 1, 12));
  return d.toISOString().slice(0, 10);
}

const toMin = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};

/** Sichtbare Stunden: Arbeitszeiten plus Termine außerhalb, mindestens 9 bis 19 Uhr */
export function hourRange(rules: { start_time: string; end_time: string }[], events: { start: string; end: string }[], tz: string) {
  let from = 9 * 60;
  let to = 19 * 60;
  for (const r of rules) {
    from = Math.min(from, toMin(r.start_time));
    to = Math.max(to, toMin(r.end_time));
  }
  for (const e of events) {
    from = Math.min(from, toMin(dateToLocal(e.start, tz).time));
    const end = dateToLocal(e.end, tz);
    const endMin = end.date === dateToLocal(e.start, tz).date ? toMin(end.time) : 24 * 60;
    to = Math.max(to, endMin);
  }
  return { fromHour: Math.floor(from / 60), toHour: Math.min(24, Math.ceil(to / 60)) };
}

/**
 * Lage eines Termins in der Tagesspalte, in Minuten ab Beginn des Rasters.
 * Ragt etwas über den Tag hinaus (z. B. Urlaub über mehrere Tage), wird es abgeschnitten.
 */
export function placeOnDay(start: string, end: string, day: string, fromHour: number, toHour: number, tz: string) {
  const s = dateToLocal(start, tz);
  const e = dateToLocal(end, tz);
  const startMin = s.date < day ? 0 : s.date > day ? null : toMin(s.time);
  const endMin = e.date > day ? 24 * 60 : e.date < day ? null : toMin(e.time);
  if (startMin === null || endMin === null) return null;
  const top = Math.max(startMin, fromHour * 60) - fromHour * 60;
  const bottom = Math.min(endMin, toHour * 60) - fromHour * 60;
  if (bottom <= top) return null;
  return { top, height: bottom - top };
}
