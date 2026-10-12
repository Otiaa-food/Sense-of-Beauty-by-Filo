import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { MonthGrid } from "@/components/admin/MonthGrid";
import { AdminTitle, btnSolid, Card, Loading, StatusBadge } from "@/components/admin/ui";
import { addMonths, formatMonth } from "@/components/booking/calendar";
import { dayRange } from "@/lib/admin/time";
import { requireAdmin } from "@/lib/admin/auth";
import { fmtDate, fmtTime } from "@/lib/admin/format";
import { dateToLocal } from "@/lib/admin/time";
import { brand } from "@/lib/brand.config";

export const metadata: Metadata = { title: "Termine" };

type Props = { searchParams: Promise<{ ansicht?: string; monat?: string }> };

export default function AppointmentsPage(props: Props) {
  return (
    <>
      <AdminTitle
        subtitle="Alle kommenden und vergangenen Termine. Im Kalender links siehst du, an welchen Tagen etwas los ist."
        action={<Link href="/admin/appointments/new" className={btnSolid}><Plus size={16} aria-hidden="true" /> Termin eintragen</Link>}
      >
        Termine
      </AdminTitle>
      <Suspense fallback={<Loading />}>
        <List {...props} />
      </Suspense>
    </>
  );
}

type Row = {
  id: string;
  start_time: string;
  status: string;
  source: string;
  services: { name: string } | null;
  customers: { first_name: string; last_name: string } | null;
};

async function List({ searchParams }: Props) {
  const { supabase } = await requireAdmin();
  const { ansicht, monat } = await searchParams;
  const tz = brand.timezone;
  const today = dateToLocal(new Date(), tz).date;
  const month = monat && /^\d{4}-\d{2}$/.test(monat) ? monat : today.slice(0, 7);
  const past = ansicht === "vergangen";
  const now = new Date().toISOString();
  let q = supabase
    .from("appointments")
    .select("id, start_time, status, source, services(name), customers(first_name, last_name)")
    .limit(200);
  q = past ? q.lt("start_time", now).order("start_time", { ascending: false }) : q.gte("start_time", now).order("start_time");
  const { data } = await q;
  const rows = (data ?? []) as unknown as Row[];

  // Termine im angezeigten Monat (für die Punkte im Kalender)
  const mFrom = dayRange(`${month}-01`, tz)!.from;
  const mTo = dayRange(`${addMonths(month, 1)}-01`, tz)!.from;
  const { data: monthData } = await supabase
    .from("appointments")
    .select("start_time, status")
    .gte("start_time", mFrom.toISOString())
    .lt("start_time", mTo.toISOString())
    .neq("status", "cancelled");
  const perDay = new Map<string, number>();
  for (const r of monthData ?? []) {
    const k = dateToLocal(r.start_time, tz).date;
    perDay.set(k, (perDay.get(k) ?? 0) + 1);
  }
  const base = `/admin/appointments?${past ? "ansicht=vergangen&" : ""}`;

  // nach Tagen gruppieren
  const groups = new Map<string, Row[]>();
  for (const r of rows) {
    const key = dateToLocal(r.start_time, tz).date;
    groups.set(key, [...(groups.get(key) ?? []), r]);
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[20rem_minmax(0,1fr)] xl:items-start">
      <Card
        className="max-w-md xl:sticky xl:top-6 xl:max-w-none"
        title={<span className="capitalize">{formatMonth(month)}</span>}
        action={
          <span className="flex gap-1">
            <Link href={`${base}monat=${addMonths(month, -1)}`} aria-label="Vorheriger Monat" className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-sand"><ChevronLeft size={16} aria-hidden="true" /></Link>
            <Link href={`${base}monat=${addMonths(month, 1)}`} aria-label="Nächster Monat" className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-sand"><ChevronRight size={16} aria-hidden="true" /></Link>
          </span>
        }
        bodyClassName="p-4"
      >
        <MonthGrid
          compact
          month={month}
          today={today}
          href={(d) => `/admin/kalender?ansicht=tag&tag=${d}`}
          cell={(d) => {
            const n = perDay.get(d) ?? 0;
            return n ? (
              <span className="flex justify-center gap-0.5" aria-label={`${n} Termine`}>
                {Array.from({ length: Math.min(n, 4) }, (_, i) => (
                  <span key={i} className="h-1 w-1 rounded-full bg-cocoa group-aria-[current=date]:bg-white" />
                ))}
              </span>
            ) : null;
          }}
        />
        <p className="mt-3 text-xs text-muted">Ein Punkt je Termin. Klick auf einen Tag öffnet die Tagesansicht.</p>
      </Card>

      <div>
        <div className="mb-5 inline-flex rounded-full bg-card p-1 shadow-sm ring-1 ring-card-line text-sm">
          <Link href="/admin/appointments" aria-current={!past ? "page" : undefined} className={`rounded-full px-4 py-1.5 ${!past ? "bg-espresso text-white" : "text-muted hover:text-cocoa"}`}>Kommende</Link>
          <Link href="/admin/appointments?ansicht=vergangen" aria-current={past ? "page" : undefined} className={`rounded-full px-4 py-1.5 ${past ? "bg-espresso text-white" : "text-muted hover:text-cocoa"}`}>Vergangene</Link>
        </div>
        {rows.length === 0 ? <p className="card p-6 text-muted">Keine Termine.</p> : null}
        <div className="space-y-6">
          {[...groups.entries()].map(([key, list]) => (
            <section key={key}>
              <h2 className="mb-2 flex items-center justify-between text-sm font-medium text-espresso">
                {fmtDate(list[0].start_time, { weekday: "long", day: "numeric", month: "long" })}
                <Link href={`/admin/kalender?ansicht=tag&tag=${key}`} className="text-xs font-normal text-muted hover:text-cocoa">im Kalender</Link>
              </h2>
              <ul className="card divide-y divide-card-line overflow-hidden">
                {list.map((r) => (
                  <li key={r.id}>
                    <Link href={`/admin/appointments/${r.id}`} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 hover:bg-sand/60">
                      <span className="w-12 font-medium text-espresso">{fmtTime(r.start_time)}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-espresso">{r.customers ? `${r.customers.first_name} ${r.customers.last_name}` : "Unbekannt"}</span>
                        <span className="block text-sm text-muted">{r.services?.name}</span>
                      </span>
                      {r.source === "online" ? <span className="text-xs text-muted">online</span> : null}
                      <StatusBadge status={r.status} />
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
