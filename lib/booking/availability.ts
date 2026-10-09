import { TZDate } from "@date-fns/tz";

/**
 * Freie Termine berechnen. Reine Funktionen ohne Datenbank, deshalb gut testbar.
 *
 * Grundidee:
 * - Arbeitszeiten sind lokale Uhrzeiten ("10:00") je Wochentag, in der Zeitzone des Studios.
 * - Ein Termin belegt Behandlungsdauer + Pufferzeit (Pause danach).
 * - Mögliche Startzeiten liegen im Raster (z. B. alle 15 Minuten) ab Beginn der Arbeitszeit.
 * - Die Behandlung muss vor Ende der Arbeitszeit fertig sein. Die Pause danach darf darüber hinausgehen.
 * - Eine Startzeit ist frei, wenn [Start, Ende + Puffer) weder einen Termin noch eine Sperrzeit berührt.
 * - Mindestvorlauf (z. B. 12 Std.) und maximale Vorausbuchung (z. B. 60 Tage) gelten zusätzlich.
 * Alle Zeitpunkte werden intern als echte Zeitpunkte (UTC) gerechnet, daher stimmt auch die Sommer-/Winterzeit.
 */

export type AvailabilityRule = { day_of_week: number; start_time: string; end_time: string };
export type BusyRange = { start: Date | string; end: Date | string };
export type BookingSettings = {
  timezone: string;
  slotIntervalMinutes: number;
  minNoticeHours: number;
  maxDaysAhead: number;
};

const MIN = 60_000;

/** "2026-10-25" für einen Zeitpunkt in der Zeitzone des Studios */
export function localDateKey(at: Date, timezone: string): string {
  const d = TZDate.tz(timezone, at.getTime());
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function parseDateKey(key: string): [number, number, number] {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key);
  if (!m) throw new Error(`Ungültiges Datum: ${key}`);
  return [Number(m[1]), Number(m[2]), Number(m[3])];
}

function parseTime(value: string): [number, number] {
  const m = /^(\d{1,2}):(\d{2})/.exec(value);
  if (!m) throw new Error(`Ungültige Uhrzeit: ${value}`);
  return [Number(m[1]), Number(m[2])];
}

/** Lokale Uhrzeit an einem Tag → echter Zeitpunkt */
function localToInstant(key: string, time: string, timezone: string): number {
  const [y, mo, d] = parseDateKey(key);
  const [h, mi] = parseTime(time);
  return new TZDate(y, mo - 1, d, h, mi, timezone).getTime();
}

/** Wochentag (0 = Sonntag) eines Datums */
export function weekdayOf(key: string, timezone: string): number {
  const [y, mo, d] = parseDateKey(key);
  return new TZDate(y, mo - 1, d, 12, 0, timezone).getDay();
}

/** Alle Tage von heute bis heute + maxDaysAhead (lokale Daten, inkl. heute) */
export function bookableDateKeys(now: Date, settings: BookingSettings): string[] {
  const today = TZDate.tz(settings.timezone, now.getTime());
  const keys: string[] = [];
  for (let i = 0; i <= settings.maxDaysAhead; i++) {
    // Mittags rechnen, damit Zeitumstellungen nie einen Tag überspringen
    const d = new TZDate(today.getFullYear(), today.getMonth(), today.getDate() + i, 12, 0, settings.timezone);
    keys.push(localDateKey(d, settings.timezone));
  }
  return keys;
}

const toMs = (v: Date | string) => (typeof v === "string" ? Date.parse(v) : v.getTime());

/** Freie Startzeiten an einem Tag, sortiert */
export function slotsForDay(input: {
  day: string;
  durationMinutes: number;
  bufferMinutes: number;
  rules: AvailabilityRule[];
  busy: BusyRange[];
  settings: BookingSettings;
  now: Date;
}): Date[] {
  const { day, durationMinutes, bufferMinutes, rules, busy, settings, now } = input;
  const tz = settings.timezone;
  const step = settings.slotIntervalMinutes * MIN;
  if (durationMinutes <= 0 || step <= 0) return [];

  const allowed = bookableDateKeys(now, settings);
  if (!allowed.includes(day)) return [];

  const earliest = now.getTime() + settings.minNoticeHours * 60 * MIN;
  const weekday = weekdayOf(day, tz);
  const busyMs = busy.map((b) => [toMs(b.start), toMs(b.end)] as const);

  const found = new Set<number>();
  for (const rule of rules.filter((r) => r.day_of_week === weekday)) {
    const open = localToInstant(day, rule.start_time, tz);
    const close = localToInstant(day, rule.end_time, tz);
    for (let start = open; start + durationMinutes * MIN <= close; start += step) {
      if (start < earliest) continue;
      const blockedUntil = start + (durationMinutes + bufferMinutes) * MIN;
      const clash = busyMs.some(([bs, be]) => start < be && bs < blockedUntil);
      if (!clash) found.add(start);
    }
  }
  return [...found].sort((a, b) => a - b).map((ms) => new Date(ms));
}

/** Tage mit mindestens einer freien Zeit (für den Kalender) */
export function daysWithSlots(input: Omit<Parameters<typeof slotsForDay>[0], "day">): string[] {
  return bookableDateKeys(input.now, input.settings).filter((day) => slotsForDay({ ...input, day }).length > 0);
}

/** Uhrzeit "14:15" eines Zeitpunkts in der Zeitzone des Studios */
export function formatLocalTime(at: Date, timezone: string): string {
  const d = TZDate.tz(timezone, at.getTime());
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}
