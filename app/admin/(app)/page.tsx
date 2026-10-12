import {
  ArrowUpRight,
  CalendarDays,
  ChartColumn,
  Euro,
  Globe,
  Hourglass,
  Leaf,
  Quote,
  Sparkles,
  Trophy,
  Wallet,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AreaChart, BarList, Kpi } from "@/components/admin/charts";
import { Donut } from "@/components/admin/Donut";
import { btnSoft, Card, Flash, inputClass, linkSoft, Loading, StatusBadge } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin/auth";
import { fmtDayKey, fmtTime } from "@/lib/admin/format";
import { dateToLocal, dayRange, mondayOf } from "@/lib/admin/time";
import { addDays } from "@/components/booking/calendar";
import { brand } from "@/lib/brand.config";
import { change } from "@/lib/stats";
import { greeting, monthInsights, periodComparison, weeklyRevenue, type OverviewRow } from "@/lib/overview";
import { saveMotto } from "./actions";

export const metadata: Metadata = { title: "Übersicht" };

type Props = { searchParams: Promise<{ meldung?: string }> };

export default function OverviewPage(props: Props) {
  return (
    <Suspense fallback={<Loading />}>
      <Overview {...props} />
    </Suspense>
  );
}

type Row = OverviewRow & {
  id: string;
  end_time: string;
  services: { name: string } | null;
  customers: { first_name: string; last_name: string } | null;
};

const euro = (n: number) => new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);

async function Overview({ searchParams }: Props) {
  const { supabase } = await requireAdmin();
  const { meldung } = await searchParams;
  const tz = brand.timezone;
  const nowDate = new Date();
  const now = dateToLocal(nowDate, tz);
  const today = now.date;
  // 12 Wochen zurück (Umsatzkurve) und Vormonat (Vergleich), bis Ende heute
  const from = dayRange(addDays(mondayOf(today), -7 * 11 - 35), tz)!.from;
  const todayRange = dayRange(today, tz)!;

  const [{ data }, { count: waitlist }, { data: motto }] = await Promise.all([
    supabase
      .from("appointments")
      .select("id, start_time, end_time, status, price, source, services(name), customers(first_name, last_name)")
      .gte("start_time", from.toISOString())
      .lt("start_time", todayRange.to.toISOString())
      .order("start_time")
      .limit(3000),
    supabase.from("waitlist").select("id", { count: "exact", head: true }).in("status", ["waiting", "notified"]).gte("desired_date", today),
    supabase.from("settings").select("value").eq("key", "admin_motto").maybeSingle(),
  ]);
  const rows = (data ?? []) as unknown as Row[];
  const todays = rows.filter((r) => dateToLocal(r.start_time, tz).date === today && r.status !== "cancelled");
  const next = todays.find((r) => Date.parse(r.end_time) > nowDate.getTime());
  const c = periodComparison(rows, today, tz);
  const weekly = weeklyRevenue(rows, today, tz);
  const insights = monthInsights(c, { waitlist: waitlist ?? 0 });
  const monthStart = dayRange(`${today.slice(0, 7)}-01`, tz)!.from.getTime();
  const monthRows = rows.filter((r) => Date.parse(r.start_time) >= monthStart);
  const top = new Map<string, number>();
  for (const r of monthRows) if (r.status === "completed") top.set(r.services?.name ?? "Behandlung", (top.get(r.services?.name ?? "Behandlung") ?? 0) + 1);
  const topList = [...top.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  const mottoText = (typeof motto?.value === "string" && motto.value.trim()) || brand.motto;
  const hour = Number(now.time.slice(0, 2));

  return (
    <div className="space-y-6">
      <Flash code={meldung} />

      {/* Begrüßung */}
      <header className="anim-fade-up flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted">{greeting(hour)},</p>
          <h1 className="text-3xl font-light text-espresso md:text-[2.6rem]">{brand.ownerName} – schön, dass du da bist.</h1>
          <p className="mt-1.5 text-sm text-muted">So läuft dein Studio heute und diesen Monat.</p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full bg-card px-4 py-2 text-sm text-espresso shadow-sm ring-1 ring-card-line">
          <CalendarDays size={16} className="text-cocoa" aria-hidden="true" />
          {fmtDayKey(today, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </span>
      </header>

      {/* Kennzahlen */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi index={0} icon={CalendarDays} label="Termine heute" value={todays.length} hint={next ? `nächster ${fmtTime(next.start_time)} Uhr` : todays.length ? "alle erledigt" : "freier Tag"} />
        <Kpi index={1} icon={Wallet} label="Umsatz diese Woche" value={c.weekRevenue} format="euro" delta={change(c.weekRevenue, c.prevWeekRevenue)} hint="zur Vorwoche" />
        <Kpi index={2} icon={Euro} label="Umsatz diesen Monat" value={c.monthRevenue} format="euro" delta={change(c.monthRevenue, c.prevMonthRevenue)} hint="zum Vormonat" />
        <Kpi index={3} icon={Hourglass} label="Auf der Warteliste" value={waitlist ?? 0} hint="kommende Wunschtage" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <Card icon={ChartColumn} title="Umsatz der letzten 12 Wochen" action={<Link href="/admin/statistik" className={linkSoft}>Statistik</Link>}>
          <AreaChart points={weekly} />
        </Card>

        {/* Heute */}
        <Card icon={CalendarDays} title="Heute" action={<Link href={`/admin/kalender?ansicht=tag&tag=${today}`} className={linkSoft}>Tagesansicht</Link>}>
          {todays.length === 0 ? (
            <p className="py-6 text-sm text-muted">Heute keine Termine. Zeit zum Durchatmen.</p>
          ) : (
            <ol className="relative space-y-1 border-l border-card-line pl-4">
              {todays.map((r, i) => (
                <li key={r.id} className="anim-fade-up" style={{ "--delay": `${0.1 + i * 0.05}s` } as React.CSSProperties}>
                  <span aria-hidden="true" className={`absolute -left-[5px] mt-3 h-2.5 w-2.5 rounded-full ring-2 ring-card ${r === next ? "bg-cocoa" : "bg-caramel/60"}`} />
                  <Link href={`/admin/appointments/${r.id}`} className="block rounded-xl px-2 py-1.5 hover:bg-sand/60">
                    <span className="flex items-center justify-between gap-2 text-sm">
                      <span className="font-medium text-espresso">{fmtTime(r.start_time)}</span>
                      <StatusBadge status={r.status} />
                    </span>
                    <span className="block truncate text-sm text-espresso">{r.customers ? `${r.customers.first_name} ${r.customers.last_name}` : "Unbekannt"}</span>
                    <span className="block truncate text-xs text-muted">{r.services?.name}</span>
                  </Link>
                </li>
              ))}
            </ol>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card icon={Sparkles} title="Beliebt diesen Monat">
          <BarList items={topList.map(([label, value]) => ({ label, value, display: `${value}×` }))} empty="Noch keine Behandlung mit „Erschienen“ diesen Monat." />
        </Card>
        <Card icon={Globe} title="Wo wurde gebucht?">
          <Donut
            slices={[
              { label: "Online", value: c.monthOnline },
              { label: "Im Studio", value: c.monthBooked - c.monthOnline },
            ]}
            centerLabel="Buchungen im Monat"
            empty="Diesen Monat noch keine Buchungen."
            delay={0.3}
          />
        </Card>

        {/* Leitsatz */}
        <section className="card relative overflow-hidden bg-gradient-to-br from-card to-blush p-6">
          <Quote size={28} strokeWidth={1.4} className="text-caramel" aria-hidden="true" />
          <blockquote className="mt-3 text-lg font-light leading-relaxed text-espresso">{mottoText}</blockquote>
          <p className="mt-3 text-sm text-muted">– {brand.fullName}</p>
          <Leaf size={90} strokeWidth={0.8} className="pointer-events-none absolute -bottom-4 -right-3 text-caramel/40" aria-hidden="true" />
          <details className="relative mt-4">
            <summary className="cursor-pointer text-xs text-muted underline underline-offset-4 hover:text-cocoa">Leitsatz ändern</summary>
            <form action={saveMotto} className="mt-3 space-y-2">
              <textarea name="motto" rows={3} maxLength={240} defaultValue={mottoText} className={`${inputClass} py-2 text-sm`} aria-label="Leitsatz" />
              <button type="submit" className={btnSoft}>Speichern</button>
            </form>
          </details>
        </section>
      </div>

      {/* Monatsfazit */}
      <section className="anim-fade-up overflow-hidden rounded-[1.25rem] bg-gradient-to-r from-sidebar to-cocoa p-6 text-white md:p-7" style={{ "--delay": "0.4s" } as React.CSSProperties}>
        <div className="grid gap-6 md:grid-cols-[minmax(0,1.2fr)_repeat(3,minmax(0,1fr))] md:items-center">
          <div className="flex items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/10 text-caramel">
              <Trophy size={22} strokeWidth={1.5} aria-hidden="true" />
            </span>
            <div>
              <p className="text-lg font-normal">Dein Monat bisher</p>
              <p className="mt-1 text-sm text-white/75">{insights.headline}</p>
              <p className="mt-2 text-xs text-white/50">{euro(c.monthRevenue)} Umsatz, {c.monthVisits} Behandlungen</p>
            </div>
          </div>
          {insights.items.map((it) => (
            <div key={it.title} className="border-t border-white/10 pt-4 md:border-l md:border-t-0 md:pl-5 md:pt-0">
              <p className="text-sm font-medium">{it.title}</p>
              <p className="mt-1 text-xs leading-relaxed text-white/70">{it.text}</p>
              {it.href ? (
                <Link href={it.href} className="mt-2 inline-flex items-center gap-1 text-xs text-caramel hover:text-white">
                  {it.cta} <ArrowUpRight size={13} aria-hidden="true" />
                </Link>
              ) : null}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
