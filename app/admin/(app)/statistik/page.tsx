import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AdminTitle, btnSolid, inputClass, Loading } from "@/components/admin/ui";
import { BarList, Kpi, TimelineChart } from "@/components/admin/charts";
import { requireAdmin } from "@/lib/admin/auth";
import { dayRange } from "@/lib/admin/time";
import { fmtDayKey } from "@/lib/admin/format";
import { brand } from "@/lib/brand.config";
import { change, computeStats, presets, previousRange, resolveRange, type StatAppointment } from "@/lib/stats";

export const metadata: Metadata = { title: "Statistik" };

type Props = { searchParams: Promise<{ zeitraum?: string; von?: string; bis?: string }> };

export default function StatsPage(props: Props) {
  return (
    <>
      <AdminTitle>Statistik</AdminTitle>
      <Suspense fallback={<Loading />}>
        <Content {...props} />
      </Suspense>
    </>
  );
}

const euro = (n: number) => new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);
const pct = (n: number) => new Intl.NumberFormat("de-DE", { style: "percent", maximumFractionDigits: 0 }).format(n);

type Supabase = Awaited<ReturnType<typeof requireAdmin>>["supabase"];

/** Supabase liefert höchstens 1000 Zeilen pro Abfrage: seitenweise holen */
async function fetchAppointments(supabase: Supabase, from: Date, to: Date): Promise<StatAppointment[]> {
  const out: StatAppointment[] = [];
  for (let page = 0; page < 50; page++) {
    const { data, error } = await supabase
      .from("appointments")
      .select("start_time, status, price, source, customer_id, services(name), customers(first_name, last_name)")
      .gte("start_time", from.toISOString())
      .lt("start_time", to.toISOString())
      .order("start_time")
      .range(page * 1000, page * 1000 + 999);
    if (error) throw error;
    for (const r of data ?? []) {
      const s = r.services as unknown as { name: string } | null;
      const c = r.customers as unknown as { first_name: string; last_name: string } | null;
      out.push({
        start_time: r.start_time,
        status: r.status,
        price: r.price,
        source: r.source,
        customer_id: r.customer_id,
        customer_name: c ? `${c.first_name} ${c.last_name}`.trim() : "Unbekannt",
        service_name: s?.name ?? "Behandlung",
      });
    }
    if (!data || data.length < 1000) break;
  }
  return out;
}

async function customersBefore(supabase: Supabase, before: Date): Promise<Set<string>> {
  const ids = new Set<string>();
  for (let page = 0; page < 50; page++) {
    const { data, error } = await supabase
      .from("appointments")
      .select("customer_id")
      .eq("status", "completed")
      .lt("start_time", before.toISOString())
      .order("start_time")
      .range(page * 1000, page * 1000 + 999);
    if (error) throw error;
    for (const r of data ?? []) ids.add(r.customer_id);
    if (!data || data.length < 1000) break;
  }
  return ids;
}

async function Content({ searchParams }: Props) {
  const { supabase } = await requireAdmin();
  const tz = brand.timezone;
  const range = resolveRange(await searchParams, new Date(), tz);
  const prev = previousRange(range);
  const from = dayRange(prev.from, tz)!.from;
  const to = dayRange(range.to, tz)!.to;
  const currentFrom = dayRange(range.from, tz)!.from;

  const [rows, known] = await Promise.all([fetchAppointments(supabase, from, to), customersBefore(supabase, currentFrom)]);
  const s = computeStats(rows, range, known, tz);
  const p = computeStats(rows, prev, new Set(), tz);

  return (
    <div className="max-w-5xl">
      {/* Zeitraum */}
      <div className="flex flex-wrap gap-1.5">
        {presets.map((x) => (
          <Link
            key={x.value}
            href={`/admin/statistik?zeitraum=${x.value}`}
            aria-current={range.preset === x.value ? "page" : undefined}
            className={`label inline-flex min-h-10 items-center border px-4 ${range.preset === x.value ? "border-espresso bg-espresso text-white" : "border-line bg-white text-muted hover:border-espresso hover:text-espresso"}`}
          >
            {x.label}
          </Link>
        ))}
      </div>
      <form className="mt-3 flex flex-wrap items-end gap-3">
        <label className="block">
          <span className="label !text-[0.6rem] text-muted">Von</span>
          <input type="date" name="von" defaultValue={range.from} className={`${inputClass} min-h-10`} />
        </label>
        <label className="block">
          <span className="label !text-[0.6rem] text-muted">Bis</span>
          <input type="date" name="bis" defaultValue={range.to} className={`${inputClass} min-h-10`} />
        </label>
        <button type="submit" className={`${btnSolid} min-h-10`}>Anzeigen</button>
      </form>
      <p className="mt-4 text-sm text-muted">
        {fmtDayKey(range.from, { day: "numeric", month: "long", year: "numeric" })} bis{" "}
        {fmtDayKey(range.to, { day: "numeric", month: "long", year: "numeric" })}. Vergleich mit dem gleich langen Zeitraum davor.
      </p>

      {/* Kennzahlen */}
      <div className="mt-8 grid grid-cols-2 gap-1.5 lg:grid-cols-4">
        <Kpi label="Umsatz" value={euro(s.revenue)} delta={change(s.revenue, p.revenue)} hint="nur „Erschienen“" />
        <Kpi label="Behandlungen" value={String(s.completed)} delta={change(s.completed, p.completed)} />
        <Kpi label="Ø pro Termin" value={euro(s.avgTicket)} delta={change(s.avgTicket, p.avgTicket)} />
        <Kpi label="Neukundinnen" value={String(s.newCustomers)} hint={`${s.returningCustomers} Stammkundinnen`} />
        <Kpi label="Nicht erschienen" value={pct(s.noShowRate)} hint={`${s.noShows}×`} delta={change(s.noShowRate, p.noShowRate)} lowerIsBetter />
        <Kpi label="Absagen" value={String(s.cancelled)} delta={change(s.cancelled, p.cancelled)} lowerIsBetter />
        <Kpi label="Online gebucht" value={pct(s.onlineShare)} hint="Anteil aller Buchungen" />
        <Kpi label="Noch geplant" value={euro(s.upcomingRevenue)} hint={`${s.upcoming} Termine im Zeitraum`} />
      </div>

      <section className="mt-12">
        <h2 className="text-2xl font-light text-espresso">Umsatz {s.timeline.unit === "week" ? "pro Woche" : "pro Monat"}</h2>
        <TimelineChart buckets={s.timeline.buckets} format="euro" />
      </section>

      <div className="mt-12 grid grid-cols-1 gap-12 lg:grid-cols-2">
        <section>
          <h2 className="text-2xl font-light text-espresso">Meistgebuchte Behandlungen</h2>
          <BarList
            items={s.services.slice(0, 10).map((x) => ({ label: x.name, value: x.count, note: euro(x.revenue) }))}
            empty="Im Zeitraum noch keine Behandlung mit „Erschienen“."
          />
        </section>
        <section>
          <h2 className="text-2xl font-light text-espresso">Umsatz pro Kundin</h2>
          <BarList
            items={s.customers.slice(0, 10).map((x) => ({
              label: x.name,
              value: x.revenue,
              display: euro(x.revenue),
              note: `${x.visits}×`,
              href: `/admin/customers/${x.id}`,
            }))}
            empty="Im Zeitraum noch keine Umsätze."
          />
        </section>
        <section>
          <h2 className="text-2xl font-light text-espresso">Termine nach Wochentag</h2>
          <BarList items={s.weekdays.map((x) => ({ label: x.label, value: x.count }))} empty="Keine Termine im Zeitraum." />
        </section>
        <section>
          <h2 className="text-2xl font-light text-espresso">Beliebte Uhrzeiten</h2>
          <BarList items={s.hours.map((x) => ({ label: x.label, value: x.count }))} empty="Keine Termine im Zeitraum." />
        </section>
      </div>
      <p className="mt-12 text-sm text-muted">
        Tipp: Termine nach der Behandlung auf „Erschienen“ setzen, sonst fehlen sie im Umsatz. Ältere Zahlen aus Planity kommen mit dem Import dazu.
      </p>
    </div>
  );
}
