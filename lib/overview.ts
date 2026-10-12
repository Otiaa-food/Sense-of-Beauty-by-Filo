import { addDays } from "@/components/booking/calendar";
import { localDateKey } from "@/lib/booking/availability";
import { mondayOf } from "@/lib/admin/time";

/** Zahlen für die Übersicht (Startseite im Admin). Reine Funktionen, gut testbar. */

export type OverviewRow = { start_time: string; status: string; price: number | string; source: string };

const sumCompleted = (rows: OverviewRow[]) => rows.filter((r) => r.status === "completed").reduce((s, r) => s + Number(r.price), 0);

/** Umsatz („Erschienen") je Woche, die letzten `weeks` Wochen bis einschließlich dieser */
export function weeklyRevenue(rows: OverviewRow[], today: string, tz: string, weeks = 12) {
  const thisMonday = mondayOf(today);
  const mondays = Array.from({ length: weeks }, (_, i) => addDays(thisMonday, -7 * (weeks - 1 - i)));
  const totals = new Map(mondays.map((m) => [m, 0]));
  for (const r of rows) {
    if (r.status !== "completed") continue;
    const m = mondayOf(localDateKey(new Date(r.start_time), tz));
    if (totals.has(m)) totals.set(m, totals.get(m)! + Number(r.price));
  }
  return mondays.map((m) => ({ label: `${Number(m.slice(8))}.${Number(m.slice(5, 7))}.`, value: totals.get(m)! }));
}

/** Zeitraum-Summe nach Ortsdatum (beide Enden eingeschlossen) */
function between(rows: OverviewRow[], from: string, to: string, tz: string) {
  return rows.filter((r) => {
    const k = localDateKey(new Date(r.start_time), tz);
    return k >= from && k <= to;
  });
}

/**
 * Fairer Vergleich: dieser Monat bis heute gegen die gleichen Tage im Vormonat,
 * diese Woche bis heute gegen die gleichen Tage der Vorwoche.
 */
export function periodComparison(rows: OverviewRow[], today: string, tz: string) {
  const [y, m, d] = today.split("-").map(Number);
  const monthStart = `${today.slice(0, 7)}-01`;
  const prevMonth = new Date(Date.UTC(y, m - 2, 1, 12));
  const prevMonthKey = prevMonth.toISOString().slice(0, 7);
  const prevMonthDays = new Date(Date.UTC(y, m - 1, 0, 12)).getUTCDate();
  const prevSameDay = `${prevMonthKey}-${String(Math.min(d, prevMonthDays)).padStart(2, "0")}`;
  const monday = mondayOf(today);
  const daysIntoWeek = Math.round((Date.parse(`${today}T12:00:00Z`) - Date.parse(`${monday}T12:00:00Z`)) / 86_400_000);
  const prevMonday = addDays(monday, -7);

  const month = between(rows, monthStart, today, tz);
  const prevMonthRows = between(rows, `${prevMonthKey}-01`, prevSameDay, tz);
  const week = between(rows, monday, today, tz);
  const prevWeek = between(rows, prevMonday, addDays(prevMonday, daysIntoWeek), tz);
  return {
    monthRevenue: sumCompleted(month),
    prevMonthRevenue: sumCompleted(prevMonthRows),
    monthVisits: month.filter((r) => r.status === "completed").length,
    weekRevenue: sumCompleted(week),
    prevWeekRevenue: sumCompleted(prevWeek),
    monthOnline: month.filter((r) => r.status !== "cancelled" && r.source === "online").length,
    monthBooked: month.filter((r) => r.status !== "cancelled").length,
  };
}

export type Insight = { title: string; text: string; href?: string; cta?: string };

/** Kurzes Monatsfazit aus echten Zahlen (für das Band unten auf der Übersicht) */
export function monthInsights(c: ReturnType<typeof periodComparison>, extra: { waitlist: number }): { headline: string; items: Insight[] } {
  const delta = c.prevMonthRevenue > 0 ? (c.monthRevenue - c.prevMonthRevenue) / c.prevMonthRevenue : null;
  const pct = (n: number) => new Intl.NumberFormat("de-DE", { style: "percent", maximumFractionDigits: 0, signDisplay: "always" }).format(n);
  let headline: string;
  if (c.monthVisits === 0) headline = "Der Monat hat gerade begonnen. Auf einen schönen Start!";
  else if (delta === null) headline = `Schon ${c.monthVisits} Behandlungen diesen Monat. Weiter so!`;
  else if (delta >= 0.05) headline = `Starker Monat: ${pct(delta)} Umsatz gegenüber dem Vormonat bis heute.`;
  else if (delta > -0.05) headline = "Du liegst genau auf Vormonats-Niveau. Stabil!";
  else headline = `Etwas ruhiger als im Vormonat (${pct(delta)}). Zeit für eine kleine Aktion?`;

  const items: Insight[] = [];
  if (delta !== null && delta < -0.05) {
    items.push({ title: "Kundinnen erinnern", text: "Eine Rundnachricht mit freien Terminen füllt ruhige Tage.", href: "/admin/kampagnen", cta: "Kampagne" });
  }
  if (extra.waitlist > 0) {
    items.push({ title: `${extra.waitlist} auf der Warteliste`, text: "Wird etwas frei, bekommen sie automatisch eine SMS.", href: "/admin/warteliste", cta: "Ansehen" });
  }
  const share = c.monthBooked ? c.monthOnline / c.monthBooked : 0;
  items.push(
    share >= 0.5
      ? { title: "Online-Buchung läuft", text: `${Math.round(share * 100)} % der Termine kamen diesen Monat online.` }
      : { title: "Mehr online buchen lassen", text: "Den Buchungslink in Instagram-Bio und Google-Profil setzen.", href: "/admin/statistik", cta: "Statistik" },
  );
  items.push({ title: "Bewertungen sammeln", text: "Termine auf „Erschienen“ setzen: Am Folgetag geht die Bitte um eine Google-Bewertung raus." });
  return { headline, items: items.slice(0, 3) };
}

export function greeting(hour: number) {
  if (hour < 11) return "Guten Morgen";
  if (hour < 18) return "Hallo";
  return "Guten Abend";
}
