import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import {
  CalendarCheck,
  CalendarDays,
  CalendarX,
  ChartColumn,
  Clock,
  Euro,
  Flower2,
  Globe,
  Heart,
  Smartphone,
  Sparkles,
  UserPlus,
  Users,
  UserX,
  Wallet,
} from "lucide-react";
import { BarList, Kpi, TimelineChart } from "@/components/admin/charts";
import { Donut } from "@/components/admin/Donut";
import { AdminTitle, btnSolid, Card, inputClass, Loading } from "@/components/admin/ui";
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
      <AdminTitle subtitle="So läuft dein Studio: Umsatz, Kundinnen und Termine auf einen Blick.">Statistik</AdminTitle>
      <Suspense fallback={<Loading />}>
        <Content {...props} />
      </Suspense>
    </>
  );
}

const euro = (n: number) => new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);

type Supabase = Awaited<ReturnType<typeof requireAdmin>>["supabase"];

/** Supabase liefert höchstens 1000 Zeilen pro Abfrage: seitenweise holen */
async function fetchAppointments(supabase: Supabase, from: Date, to: Date): Promise<StatAppointment[]> {
  const out: StatAppointment[] = [];
  for (let page = 0; page < 50; page++) {
    const { data, error } = await supabase
      .from("appointments")
      .select("start_time, status, price, source, customer_id, services(name, service_categories(name)), customers(first_name, last_name)")
      .gte("start_time", from.toISOString())
      .lt("start_time", to.toISOString())
      .order("start_time")
      .range(page * 1000, page * 1000 + 999);
    if (error) throw error;
    for (const r of data ?? []) {
      const s = r.services as unknown as { name: string; service_categories: { name: string } | null } | null;
      const c = r.customers as unknown as { first_name: string; last_name: string } | null;
      out.push({
        start_time: r.start_time,
        status: r.status,
        price: r.price,
        source: r.source,
        customer_id: r.customer_id,
        customer_name: c ? `${c.first_name} ${c.last_name}`.trim() : "Unbekannt",
        service_name: s?.name ?? "Behandlung",
        category_name: s?.service_categories?.name,
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
    <div className="space-y-6">
      {/* Zeitraum: Schnellwahl als Pillen, daneben eigene Daten */}
      <div className="card flex flex-wrap items-end justify-between gap-4 p-4 md:p-5">
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Zeitraum">
          {presets.map((x) => (
            <Link
              key={x.value}
              href={`/admin/statistik?zeitraum=${x.value}`}
              aria-current={range.preset === x.value ? "page" : undefined}
              className={`inline-flex min-h-9 items-center rounded-full px-4 text-sm transition-colors ${
                range.preset === x.value ? "bg-espresso text-white" : "bg-sand text-muted hover:bg-blush hover:text-cocoa"
              }`}
            >
              {x.label}
            </Link>
          ))}
        </div>
        <form className="flex flex-wrap items-end gap-2">
          <label className="block">
            <span className="text-xs text-muted">Von</span>
            <input type="date" name="von" defaultValue={range.from} className={`${inputClass} mt-1 min-h-9 py-1 text-sm`} />
          </label>
          <label className="block">
            <span className="text-xs text-muted">Bis</span>
            <input type="date" name="bis" defaultValue={range.to} className={`${inputClass} mt-1 min-h-9 py-1 text-sm`} />
          </label>
          <button type="submit" className={`${btnSolid} min-h-9`}>Anzeigen</button>
        </form>
      </div>

      {/* Kennzahlen */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi index={0} icon={Euro} label="Umsatz" value={s.revenue} format="euro" delta={change(s.revenue, p.revenue)} hint="nur „Erschienen“" />
        <Kpi index={1} icon={Sparkles} label="Behandlungen" value={s.completed} delta={change(s.completed, p.completed)} />
        <Kpi index={2} icon={Wallet} label="Ø pro Termin" value={s.avgTicket} format="euro" delta={change(s.avgTicket, p.avgTicket)} />
        <Kpi index={3} icon={UserPlus} label="Neukundinnen" value={s.newCustomers} hint={`${s.returningCustomers} Stammkundinnen`} />
        <Kpi index={4} icon={UserX} label="Nicht erschienen" value={s.noShowRate} format="percent" delta={change(s.noShowRate, p.noShowRate)} lowerIsBetter hint={`${s.noShows}×`} />
        <Kpi index={5} icon={CalendarX} label="Absagen" value={s.cancelled} delta={change(s.cancelled, p.cancelled)} lowerIsBetter />
        <Kpi index={6} icon={Globe} label="Online gebucht" value={s.onlineShare} format="percent" hint="aller Buchungen" />
        <Kpi index={7} icon={CalendarCheck} label="Noch geplant" value={s.upcomingRevenue} format="euro" hint={`${s.upcoming} Termine`} />
      </div>

      <Card
        icon={ChartColumn}
        title={`Umsatz ${s.timeline.unit === "week" ? "pro Woche" : "pro Monat"}`}
        action={<span className="text-xs text-muted">{fmtDayKey(range.from, { day: "numeric", month: "short", year: "numeric" })} – {fmtDayKey(range.to, { day: "numeric", month: "short", year: "numeric" })}</span>}
      >
        <TimelineChart buckets={s.timeline.buckets} />
      </Card>

      {/* Kreisdiagramme */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card icon={Flower2} title="Umsatz nach Kategorie">
          <Donut slices={s.byCategory} format="euro" centerLabel="Umsatz" delay={0.2} />
        </Card>
        <Card icon={Users} title="Neu- und Stammkundinnen">
          <Donut slices={s.customerMix} centerLabel="Kundinnen" delay={0.3} />
        </Card>
        <Card icon={Smartphone} title="Wo wurde gebucht?">
          <Donut slices={s.channel} centerLabel="Buchungen" delay={0.4} />
        </Card>
        <Card icon={CalendarCheck} title="Termin-Ausgang">
          <Donut slices={s.outcomes} centerLabel="Termine" delay={0.5} />
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card icon={Sparkles} title="Meistgebuchte Behandlungen">
          <BarList
            items={s.services.slice(0, 8).map((x) => ({ label: x.name, value: x.count, display: `${x.count}×`, note: euro(x.revenue) }))}
            empty="Im Zeitraum noch keine Behandlung mit „Erschienen“."
          />
        </Card>
        <Card icon={Heart} title="Umsatz pro Kundin">
          <BarList
            items={s.customers.slice(0, 8).map((x) => ({
              label: x.name,
              value: x.revenue,
              display: euro(x.revenue),
              note: `${x.visits}×`,
              href: `/admin/customers/${x.id}`,
            }))}
            empty="Im Zeitraum noch keine Umsätze."
          />
        </Card>
        <Card icon={CalendarDays} title="Termine nach Wochentag">
          <BarList items={s.weekdays.map((x) => ({ label: x.label, value: x.count }))} empty="Keine Termine im Zeitraum." />
        </Card>
        <Card icon={Clock} title="Beliebte Uhrzeiten">
          <BarList items={s.hours.map((x) => ({ label: x.label, value: x.count }))} empty="Keine Termine im Zeitraum." />
        </Card>
      </div>

      <p className="text-sm text-muted">
        Vergleich jeweils mit dem gleich langen Zeitraum davor. Tipp: Termine nach der Behandlung auf „Erschienen“ setzen, sonst fehlen sie im
        Umsatz. Ältere Zahlen aus Planity kommen mit dem Import dazu.
      </p>
    </div>
  );
}
