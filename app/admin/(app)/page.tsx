import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AdminTitle, btnOutline, Flash, Loading, StatusBadge } from "@/components/admin/ui";
import { addDays } from "@/components/booking/calendar";
import { requireAdmin } from "@/lib/admin/auth";
import { fmtDayKey, fmtTime } from "@/lib/admin/format";
import { dateToLocal, dayRange, mondayOf } from "@/lib/admin/time";
import { brand } from "@/lib/brand.config";
import { formatPrice } from "@/lib/catalog";

export const metadata: Metadata = { title: "Kalender" };

type Props = { searchParams: Promise<{ tag?: string; meldung?: string }> };

export default function CalendarPage(props: Props) {
  return (
    <Suspense fallback={<Loading />}>
      <Calendar {...props} />
    </Suspense>
  );
}

type Row = {
  id: string;
  start_time: string;
  end_time: string;
  status: string;
  price: number;
  source: string;
  services: { name: string } | null;
  customers: { id: string; first_name: string; last_name: string; phone: string | null } | null;
};

async function Calendar({ searchParams }: Props) {
  const { supabase } = await requireAdmin();
  const { tag, meldung } = await searchParams;
  const tz = brand.timezone;
  const today = dateToLocal(new Date(), tz).date;
  const day = tag && /^\d{4}-\d{2}-\d{2}$/.test(tag) ? tag : today;
  const monday = mondayOf(day);
  const week = Array.from({ length: 7 }, (_, i) => addDays(monday, i));

  const weekRange = { from: dayRange(week[0], tz)!.from, to: dayRange(week[6], tz)!.to };
  const [{ data: appts }, { data: blocked }] = await Promise.all([
    supabase
      .from("appointments")
      .select("id, start_time, end_time, status, price, source, services(name), customers(id, first_name, last_name, phone)")
      .gte("start_time", weekRange.from.toISOString())
      .lt("start_time", weekRange.to.toISOString())
      .order("start_time"),
    supabase
      .from("blocked_times")
      .select("id, start_time, end_time, reason")
      .lt("start_time", weekRange.to.toISOString())
      .gt("end_time", weekRange.from.toISOString())
      .order("start_time"),
  ]);
  const rows = (appts ?? []) as unknown as Row[];
  const active = (r: Row) => r.status === "confirmed" || r.status === "pending" || r.status === "completed";
  const countFor = (key: string) => rows.filter((r) => active(r) && dateToLocal(r.start_time, tz).date === key).length;
  const dayRows = rows.filter((r) => dateToLocal(r.start_time, tz).date === day);
  const range = dayRange(day, tz)!;
  const dayBlocked = (blocked ?? []).filter(
    (b) => Date.parse(b.start_time) < range.to.getTime() && Date.parse(b.end_time) > range.from.getTime(),
  );
  const revenue = dayRows.filter(active).reduce((sum, r) => sum + Number(r.price), 0);

  return (
    <>
      <Flash code={meldung} />
      <AdminTitle
        action={
          <div className="flex gap-2">
            <Link href={`/admin?tag=${addDays(monday, -7)}`} className={btnOutline} aria-label="Vorherige Woche">←</Link>
            <Link href="/admin" className={btnOutline}>Heute</Link>
            <Link href={`/admin?tag=${addDays(monday, 7)}`} className={btnOutline} aria-label="Nächste Woche">→</Link>
          </div>
        }
      >
        {fmtDayKey(monday, { month: "long", year: "numeric" })}
      </AdminTitle>

      {/* Woche: ein Feld je Tag mit Anzahl der Termine */}
      <ol className="grid grid-cols-7 gap-1">
        {week.map((key) => {
          const n = countFor(key);
          const selected = key === day;
          return (
            <li key={key}>
              <Link
                href={`/admin?tag=${key}`}
                aria-current={selected ? "date" : undefined}
                className={`flex flex-col items-center py-3 transition-colors ${
                  selected ? "bg-espresso text-white" : "bg-white text-espresso hover:bg-stone"
                } ${key === today && !selected ? "ring-1 ring-inset ring-espresso" : ""}`}
              >
                <span className="label !text-[0.6rem] opacity-70">{fmtDayKey(key, { weekday: "short" })}</span>
                <span className="mt-1 text-xl font-light">{Number(key.slice(8))}</span>
                <span className="mt-1 h-4 text-xs">{n > 0 ? n : ""}</span>
              </Link>
            </li>
          );
        })}
      </ol>

      <div className="mt-10 flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="text-2xl font-light text-espresso">{fmtDayKey(day)}</h2>
        <p className="text-sm text-muted">
          {dayRows.filter(active).length} Termine{revenue > 0 ? `, ${formatPrice(revenue)}` : ""}
        </p>
      </div>

      {dayBlocked.map((b) => (
        <p key={b.id} className="mt-4 border border-dashed border-taupe bg-white p-4 text-sm text-muted">
          Gesperrt {fmtTime(b.start_time)}–{fmtTime(b.end_time)}
          {b.reason ? `: ${b.reason}` : ""}
        </p>
      ))}

      {dayRows.length === 0 ? (
        <div className="mt-6 border border-line bg-white p-6 text-muted">
          <p>Keine Termine an diesem Tag.</p>
          <Link href={`/admin/appointments/new?tag=${day}`} className="label mt-4 inline-block text-espresso underline underline-offset-4">
            Termin eintragen
          </Link>
        </div>
      ) : (
        <ul className="mt-6 divide-y divide-line border-y border-line bg-white">
          {dayRows.map((r) => (
            <li key={r.id}>
              <Link href={`/admin/appointments/${r.id}`} className="grid grid-cols-[4.5rem_1fr] gap-4 px-4 py-4 hover:bg-paper">
                <span className="text-espresso">
                  {fmtTime(r.start_time)}
                  <span className="block text-xs text-muted">bis {fmtTime(r.end_time)}</span>
                </span>
                <span className={r.status === "cancelled" ? "opacity-50" : ""}>
                  <span className="block text-espresso">
                    {r.customers ? `${r.customers.first_name} ${r.customers.last_name}` : "Unbekannt"}
                  </span>
                  <span className="block text-sm text-muted">{r.services?.name}</span>
                  <span className="mt-2 flex flex-wrap items-center gap-2">
                    <StatusBadge status={r.status} />
                    {r.source === "online" ? <span className="text-xs text-muted">online gebucht</span> : null}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
