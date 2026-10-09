import { brand } from "@/lib/brand.config";

const tz = brand.timezone;

export const statusLabels: Record<string, string> = {
  confirmed: "Bestätigt",
  pending: "Wartet auf Zahlung",
  completed: "Erschienen",
  cancelled: "Abgesagt",
  no_show: "Nicht erschienen",
};

export const sourceLabels: Record<string, string> = { online: "Online", admin: "Eingetragen", import: "Import" };

export const weekdayLabels = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];

export function fmtTime(at: string | Date) {
  return new Intl.DateTimeFormat("de-DE", { hour: "2-digit", minute: "2-digit", timeZone: tz }).format(new Date(at));
}

export function fmtDate(at: string | Date, opts: Intl.DateTimeFormatOptions = { weekday: "short", day: "numeric", month: "short", year: "numeric" }) {
  return new Intl.DateTimeFormat("de-DE", { ...opts, timeZone: tz }).format(new Date(at));
}

/** "Mo., 12. Okt." für einen Datums-Schlüssel */
export function fmtDayKey(key: string, opts: Intl.DateTimeFormatOptions = { weekday: "long", day: "numeric", month: "long" }) {
  return new Intl.DateTimeFormat("de-DE", { ...opts, timeZone: "UTC" }).format(new Date(`${key}T12:00:00Z`));
}

/** Rückmeldungen nach Aktionen (?meldung=…) */
export const flashMessages: Record<string, { text: string; error?: boolean }> = {
  gespeichert: { text: "Gespeichert." },
  angelegt: { text: "Termin eingetragen." },
  verschoben: { text: "Termin verschoben." },
  status: { text: "Status geändert." },
  geloescht: { text: "Entfernt." },
  ueberschneidung: { text: "Das überschneidet sich mit einem anderen Termin (inklusive Pause). Bitte andere Zeit wählen.", error: true },
  ungueltig: { text: "Bitte Eingaben prüfen.", error: true },
  fehler: { text: "Das hat nicht geklappt. Bitte noch einmal versuchen.", error: true },
};
