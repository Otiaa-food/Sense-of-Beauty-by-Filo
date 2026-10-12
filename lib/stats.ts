import { TZDate } from "@date-fns/tz";
import { formatLocalTime, localDateKey } from "@/lib/booking/availability";

/**
 * Kennzahlen für die Statistik im Admin. Reine Funktionen: bekommen Termine, rechnen, fertig.
 * Umsatz zählt nur Termine mit Status „Erschienen" (das Geld ist wirklich geflossen).
 * Zeiträume sind Ortsdaten (Pforzheim), beide Enden eingeschlossen.
 */

export type StatAppointment = {
  start_time: string;
  status: string;
  price: number | string;
  source: string;
  customer_id: string;
  customer_name: string;
  service_name: string;
};

export type Range = { from: string; to: string };

export type Preset = { value: string; label: string };
export const presets: Preset[] = [
  { value: "monat", label: "Dieser Monat" },
  { value: "vormonat", label: "Letzter Monat" },
  { value: "3monate", label: "Letzte 3 Monate" },
  { value: "jahr", label: "Dieses Jahr" },
  { value: "12monate", label: "Letzte 12 Monate" },
];

const pad = (n: number) => String(n).padStart(2, "0");
const key = (y: number, m: number, d: number) => {
  const dt = new Date(Date.UTC(y, m - 1, d));
  return `${dt.getUTCFullYear()}-${pad(dt.getUTCMonth() + 1)}-${pad(dt.getUTCDate())}`;
};

/** Zeitraum aus Auswahl oder eigenen Daten. Unbekanntes → „Dieser Monat". */
export function resolveRange(input: { zeitraum?: string; von?: string; bis?: string }, now: Date, timezone: string): Range & { preset: string } {
  const dateKey = /^\d{4}-\d{2}-\d{2}$/;
  if (input.von && input.bis && dateKey.test(input.von) && dateKey.test(input.bis)) {
    const [from, to] = input.von <= input.bis ? [input.von, input.bis] : [input.bis, input.von];
    return { from, to, preset: "eigen" };
  }
  const today = localDateKey(now, timezone);
  const [y, m, d] = today.split("-").map(Number);
  switch (input.zeitraum) {
    case "vormonat":
      return { from: key(y, m - 1, 1), to: key(y, m, 0), preset: "vormonat" };
    case "3monate":
      return { from: key(y, m - 3, d + 1), to: today, preset: "3monate" };
    case "jahr":
      return { from: key(y, 1, 1), to: key(y, 12, 31), preset: "jahr" };
    case "12monate":
      return { from: key(y - 1, m, d + 1), to: today, preset: "12monate" };
    default:
      return { from: key(y, m, 1), to: key(y, m + 1, 0), preset: "monat" };
  }
}

/** Gleich langer Zeitraum direkt davor (für „im Vergleich zu") */
export function previousRange(r: Range): Range {
  const from = Date.parse(`${r.from}T12:00:00Z`);
  const to = Date.parse(`${r.to}T12:00:00Z`);
  const days = Math.round((to - from) / 86_400_000) + 1;
  const prevTo = new Date(from - 86_400_000);
  const prevFrom = new Date(from - days * 86_400_000);
  return { from: prevFrom.toISOString().slice(0, 10), to: prevTo.toISOString().slice(0, 10) };
}

export type Bucket = { key: string; label: string; revenue: number; count: number };

const monthNames = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];

function mondayKey(dayKey: string) {
  const d = new Date(`${dayKey}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  return d.toISOString().slice(0, 10);
}

/** Leere Balken für den ganzen Zeitraum: bis ca. 3 Monate je Woche, sonst je Monat */
export function emptyBuckets(r: Range): { unit: "week" | "month"; buckets: Bucket[] } {
  const days = Math.round((Date.parse(`${r.to}T12:00:00Z`) - Date.parse(`${r.from}T12:00:00Z`)) / 86_400_000) + 1;
  const buckets: Bucket[] = [];
  if (days <= 95) {
    const d = new Date(`${mondayKey(r.from)}T12:00:00Z`);
    while (d.toISOString().slice(0, 10) <= r.to) {
      const k = d.toISOString().slice(0, 10);
      buckets.push({ key: k, label: `${d.getUTCDate()}.${d.getUTCMonth() + 1}.`, revenue: 0, count: 0 });
      d.setUTCDate(d.getUTCDate() + 7);
    }
    return { unit: "week", buckets };
  }
  let [y, m] = r.from.split("-").map(Number);
  const [ty, tm] = r.to.split("-").map(Number);
  while (y < ty || (y === ty && m <= tm)) {
    buckets.push({ key: `${y}-${pad(m)}`, label: `${monthNames[m - 1]}${m === 1 ? ` ${String(y).slice(2)}` : ""}`, revenue: 0, count: 0 });
    m++;
    if (m > 12) {
      m = 1;
      y++;
    }
  }
  return { unit: "month", buckets };
}

export type Stats = {
  revenue: number;
  completed: number;
  avgTicket: number;
  noShows: number;
  noShowRate: number;
  cancelled: number;
  upcoming: number;
  upcomingRevenue: number;
  newCustomers: number;
  returningCustomers: number;
  onlineShare: number;
  timeline: { unit: "week" | "month"; buckets: Bucket[] };
  services: { name: string; count: number; revenue: number }[];
  customers: { id: string; name: string; visits: number; revenue: number }[];
  weekdays: { label: string; count: number }[];
  hours: { label: string; count: number }[];
};

const weekdayLabels = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

export function computeStats(rows: StatAppointment[], range: Range, knownBefore: Set<string>, timezone: string, now = new Date()): Stats {
  const inRange = rows.filter((r) => {
    const k = localDateKey(new Date(r.start_time), timezone);
    return k >= range.from && k <= range.to;
  });
  const completed = inRange.filter((r) => r.status === "completed");
  const noShows = inRange.filter((r) => r.status === "no_show").length;
  const cancelled = inRange.filter((r) => r.status === "cancelled").length;
  const future = inRange.filter((r) => (r.status === "confirmed" || r.status === "pending") && Date.parse(r.start_time) >= now.getTime());
  const revenue = completed.reduce((s, r) => s + Number(r.price), 0);
  const booked = inRange.filter((r) => r.status !== "cancelled");

  const timeline = emptyBuckets(range);
  const index = new Map(timeline.buckets.map((b) => [b.key, b]));
  for (const r of completed) {
    const day = localDateKey(new Date(r.start_time), timezone);
    const b = index.get(timeline.unit === "week" ? mondayKey(day) : day.slice(0, 7));
    if (b) {
      b.revenue += Number(r.price);
      b.count++;
    }
  }

  const services = new Map<string, { name: string; count: number; revenue: number }>();
  const customers = new Map<string, { id: string; name: string; visits: number; revenue: number }>();
  for (const r of completed) {
    const s = services.get(r.service_name) ?? { name: r.service_name, count: 0, revenue: 0 };
    s.count++;
    s.revenue += Number(r.price);
    services.set(r.service_name, s);
    const c = customers.get(r.customer_id) ?? { id: r.customer_id, name: r.customer_name, visits: 0, revenue: 0 };
    c.visits++;
    c.revenue += Number(r.price);
    customers.set(r.customer_id, c);
  }

  // Neukundin: erster Besuch liegt im Zeitraum (vorher nie „Erschienen")
  const visitors = new Set(completed.map((r) => r.customer_id));
  const newCustomers = [...visitors].filter((id) => !knownBefore.has(id)).length;

  const weekdays = weekdayLabels.map((label) => ({ label, count: 0 }));
  const hourMap = new Map<number, number>();
  for (const r of booked) {
    const t = TZDate.tz(timezone, Date.parse(r.start_time));
    weekdays[(t.getDay() + 6) % 7].count++;
    const h = Number(formatLocalTime(new Date(r.start_time), timezone).slice(0, 2));
    hourMap.set(h, (hourMap.get(h) ?? 0) + 1);
  }
  const hourKeys = [...hourMap.keys()];
  const hours =
    hourKeys.length === 0
      ? []
      : Array.from({ length: Math.max(...hourKeys) - Math.min(...hourKeys) + 1 }, (_, i) => {
          const h = Math.min(...hourKeys) + i;
          return { label: `${h} Uhr`, count: hourMap.get(h) ?? 0 };
        });

  const attended = completed.length + noShows;
  return {
    revenue,
    completed: completed.length,
    avgTicket: completed.length ? revenue / completed.length : 0,
    noShows,
    noShowRate: attended ? noShows / attended : 0,
    cancelled,
    upcoming: future.length,
    upcomingRevenue: future.reduce((s, r) => s + Number(r.price), 0),
    newCustomers,
    returningCustomers: visitors.size - newCustomers,
    onlineShare: booked.length ? booked.filter((r) => r.source === "online").length / booked.length : 0,
    timeline,
    services: [...services.values()].sort((a, b) => b.count - a.count || b.revenue - a.revenue),
    customers: [...customers.values()].sort((a, b) => b.revenue - a.revenue || b.visits - a.visits),
    weekdays: weekdays.slice(0, 6).concat(weekdays[6].count ? [weekdays[6]] : []),
    hours,
  };
}

/** Veränderung in Prozent gegenüber vorher (null, wenn vorher 0) */
export function change(current: number, previous: number): number | null {
  if (!previous) return null;
  return (current - previous) / previous;
}
