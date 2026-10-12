import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { MonthGrid } from "@/components/admin/MonthGrid";
import { TimeGrid, type GridEvent } from "@/components/admin/TimeGrid";
import { AdminTitle, btnIcon, btnOutline, btnSolid, Card, Flash, Loading, StatusBadge } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin/auth";
import { daysForView, hourRange, parseView, shiftDay, type View } from "@/lib/admin/calendar";
import { fmtDayKey, fmtTime } from "@/lib/admin/format";
import { dateToLocal, dayRange } from "@/lib/admin/time";
import { brand } from "@/lib/brand.config";
import { formatPrice } from "@/lib/catalog";

export const metadata: Metadata = { title: "Kalender" };

type Props = { searchParams: Promise<{ tag?: string; ansicht?: string; meldung?: string }> };

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
  customers: { first_name: string; last_name: string; phone: string | null } | null;
};

const views: { value: View; label: string }[] = [
  { value: "tag", label: "Tag" },
  { value: "woche", label: "Woche" },
  { value: "monat", label: "Monat" },
];

function title(view: View, days: string[], day: string) {
  if (view === "tag") return fmtDayKey(day, { weekday: "long", day: "numeric", month: "long" });
  if (view === "monat") return fmtDayKey(`${day.slice(0, 7)}-15`, { month: "long", year: "numeric" });
  const a = days[0];
  const b = days.at(-1)!;
  const sameMonth = a.slice(0, 7) === b.slice(0, 7);
  const left = sameMonth ? `${fmtDayKey(a, { day: "numeric" })}.` : fmtDayKey(a, { day: "numeric", month: "short" });
  return `${left} – ${fmtDayKey(b, { day: "numeric", month: "long", year: "numeric" })}`;
}

async function Calendar({ searchParams }: Props) {
  const { supabase } = await requireAdmin();
  const params = await searchParams;
  const tz = brand.timezone;
  const now = dateToLocal(new Date(), tz);
  const today = now.date;
  const view = parseView(params.ansicht);
  const day = params.tag && /^\d{4}-\d{2}-\d{2}$/.test(params.tag) ? params.tag : today;
  const days = daysForView(view, day);
  const range = { from: dayRange(days[0], tz)!.from, to: dayRange(days.at(-1)!, tz)!.to };

  const [{ data: appts }, { data: blocked }, { data: rules }] = await Promise.all([
    supabase
      .from("appointments")
      .select("id, start_time, end_time, status, price, source, services(name), customers(first_name, last_name, phone)")
      .gte("start_time", range.from.toISOString())
      .lt("start_time", range.to.toISOString())
      .order("start_time"),
    supabase
      .from("blocked_times")
      .select("id, start_time, end_time, reason")
      .lt("start_time", range.to.toISOString())
      .gt("end_time", range.from.toISOString())
      .order("start_time"),
    supabase.from("availability_rules").select("day_of_week, start_time, end_time").eq("active", true),
  ]);
  const rows = (appts ?? []) as unknown as Row[];
  const active = rows.filter((r) => r.status !== "cancelled");
  const cancelled = rows.filter((r) => r.status === "cancelled");
  const name = (r: Row) => (r.customers ? `${r.customers.first_name} ${r.customers.last_name}`.trim() : "Unbekannt");
  const link = (v: View, d: string) => `/admin/kalender?ansicht=${v}&tag=${d}`;

  const events: GridEvent[] = active.map((r) => ({
    id: r.id,
    start: r.start_time,
    end: r.end_time,
    status: r.status,
    title: name(r),
    subtitle: r.services?.name,
    meta: [formatPrice(Number(r.price)), r.customers?.phone].filter(Boolean).join(" · "),
    online: r.source === "online",
  }));
  const weekdayOf = (d: string) => new Date(`${d}T12:00:00Z`).getUTCDay();
  const hours = days.map((d) => ({
    day: d,
    windows: (rules ?? []).filter((r) => r.day_of_week === weekdayOf(d)).map((r) => ({ from: r.start_time.slice(0, 5), to: r.end_time.slice(0, 5) })),
  }));
  // Sonntag nur zeigen, wenn dort gearbeitet wird oder ein Termin liegt (spart Platz am Tablet)
  const sunday = view === "woche" ? days[6] : null;
  const gridDays =
    sunday && !hours[6].windows.length && !events.some((e) => dateToLocal(e.start, tz).date === sunday) ? days.slice(0, 6) : days;
  const { fromHour, toHour } = hourRange(rules ?? [], events.map((e) => ({ start: e.start, end: e.end })), tz);
  const sum = active.filter((r) => r.status !== "no_show").reduce((s, r) => s + Number(r.price), 0);

  return (
    <>
      <Flash code={params.meldung} />
      <AdminTitle
        subtitle={`${active.length} Termine${sum ? `, ${formatPrice(sum)} geplant oder erledigt` : ""}${cancelled.length ? `, ${cancelled.length} abgesagt` : ""}`}
        action={
          <Link href={`/admin/appointments/new?tag=${day}`} className={btnSolid}>
            <Plus size={16} aria-hidden="true" /> Termin eintragen
          </Link>
        }
      >
        {title(view, days, day)}
      </AdminTitle>

      {/* Steuerung: Ansicht umschalten, blättern, heute */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-full bg-card p-1 shadow-sm ring-1 ring-card-line" role="group" aria-label="Ansicht">
          {views.map((v) => (
            <Link
              key={v.value}
              href={link(v.value, day)}
              aria-current={view === v.value ? "page" : undefined}
              className={`rounded-full px-4 py-1.5 text-sm transition-colors ${view === v.value ? "bg-espresso text-white" : "text-muted hover:text-cocoa"}`}
            >
              {v.label}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Link href={link(view, shiftDay(view, day, -1))} className={btnIcon} aria-label="Zurück">
            <ChevronLeft size={18} aria-hidden="true" />
          </Link>
          <Link href={link(view, today)} className={btnOutline}>
            Heute
          </Link>
          <Link href={link(view, shiftDay(view, day, 1))} className={btnIcon} aria-label="Weiter">
            <ChevronRight size={18} aria-hidden="true" />
          </Link>
        </div>
      </div>

      {view === "monat" ? (
        <div className="card p-3 md:p-4">
          <MonthGrid
            month={day.slice(0, 7)}
            today={today}
            href={(d) => link("tag", d)}
            dayClass={(d) =>
              (blocked ?? []).some((b) => dateToLocal(b.start_time, tz).date <= d && dateToLocal(b.end_time, tz).date >= d) ? "!bg-[#f7efe6]" : ""
            }
            cell={(d) => {
              const list = active.filter((r) => dateToLocal(r.start_time, tz).date === d);
              const isBlocked = (blocked ?? []).some((b) => dateToLocal(b.start_time, tz).date <= d && dateToLocal(b.end_time, tz).date >= d);
              return (
                <span className="block space-y-0.5">
                  {isBlocked ? <span className="block truncate rounded-md bg-caramel/20 px-1.5 text-[0.65rem] text-cocoa">Gesperrt</span> : null}
                  {list.slice(0, 3).map((r) => (
                    <span key={r.id} className="block truncate rounded-md bg-blush px-1.5 text-[0.65rem] leading-5 text-espresso group-hover:bg-[#ead6c2]">
                      {fmtTime(r.start_time)} {r.customers?.first_name ?? ""}
                    </span>
                  ))}
                  {list.length > 3 ? <span className="block px-1.5 text-[0.65rem] text-muted">+{list.length - 3} weitere</span> : null}
                </span>
              );
            }}
          />
        </div>
      ) : (
        <div className={view === "tag" ? "grid gap-5 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start" : ""}>
          <TimeGrid
            days={gridDays}
            events={events}
            blocks={(blocked ?? []).map((b) => ({ id: b.id, start: b.start_time, end: b.end_time, reason: b.reason }))}
            hours={hours}
            fromHour={fromHour}
            toHour={toHour}
            today={today}
            now={now}
            tz={tz}
            dayHref={(d) => link("tag", d)}
            detailed={view === "tag"}
          />
          {view === "tag" ? (
            <div className="space-y-5">
              <Card title="Tagesliste">
                {active.length === 0 ? (
                  <p className="text-sm text-muted">Keine Termine an diesem Tag.</p>
                ) : (
                  <ul className="space-y-3">
                    {active.map((r) => (
                      <li key={r.id}>
                        <Link href={`/admin/appointments/${r.id}`} className="block rounded-xl p-2 hover:bg-sand/60">
                          <span className="flex items-center justify-between gap-2 text-sm">
                            <span className="font-medium text-espresso">
                              {fmtTime(r.start_time)}–{fmtTime(r.end_time)}
                            </span>
                            <StatusBadge status={r.status} />
                          </span>
                          <span className="mt-0.5 block truncate text-sm text-espresso">{name(r)}</span>
                          <span className="block truncate text-xs text-muted">{r.services?.name}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
              {cancelled.length ? (
                <Card title="Abgesagt">
                  <ul className="space-y-2 text-sm text-muted">
                    {cancelled.map((r) => (
                      <li key={r.id}>
                        <Link href={`/admin/appointments/${r.id}`} className="hover:text-cocoa">
                          {fmtTime(r.start_time)} {name(r)}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </Card>
              ) : null}
            </div>
          ) : null}
        </div>
      )}

      <p className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted" aria-label="Legende">
        <span className="inline-flex items-center gap-1.5"><span className="h-3 w-5 rounded-sm border-l-[3px] border-cocoa bg-blush" /> Bestätigt</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-3 w-5 rounded-sm border-l-[3px] border-[#2f7f72] bg-[#e3efe9]" /> Erschienen</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-3 w-5 rounded-sm border-l-[3px] border-[#a4512c] bg-[#f4dfd6]" /> Nicht erschienen</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm border border-dashed border-caramel" /> Gesperrt</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm bg-[#f7f2eb] ring-1 ring-card-line" /> Außerhalb der Arbeitszeit</span>
      </p>
    </>
  );
}
