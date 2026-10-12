import type { Metadata } from "next";
import { Suspense } from "react";
import { CalendarX, Clock } from "lucide-react";
import Link from "next/link";
import { MonthGrid } from "@/components/admin/MonthGrid";
import { AdminTitle, btnOutline, btnSolid, Card, Flash, inputClass, Loading } from "@/components/admin/ui";
import { addMonths, formatMonth } from "@/components/booking/calendar";
import { dateToLocal } from "@/lib/admin/time";
import { brand } from "@/lib/brand.config";
import { requireAdmin } from "@/lib/admin/auth";
import { fmtDate, fmtTime, weekdayLabels } from "@/lib/admin/format";
import { addBlocked, addRule, deleteBlocked, deleteRule } from "../actions";

export const metadata: Metadata = { title: "Zeiten & Urlaub" };

type Props = { searchParams: Promise<{ meldung?: string; monat?: string }> };

export default function AvailabilityPage(props: Props) {
  return (
    <>
      <AdminTitle subtitle="Wann online gebucht werden kann, und wann nicht.">Zeiten & Urlaub</AdminTitle>
      <Suspense fallback={<Loading />}>
        <Content {...props} />
      </Suspense>
    </>
  );
}

const order = [1, 2, 3, 4, 5, 6, 0]; // Montag zuerst
const short = (t: string) => t.slice(0, 5);

async function Content({ searchParams }: Props) {
  const { supabase } = await requireAdmin();
  const { meldung, monat } = await searchParams;
  const tz = brand.timezone;
  const today = dateToLocal(new Date(), tz).date;
  const month = monat && /^\d{4}-\d{2}$/.test(monat) ? monat : today.slice(0, 7);
  const [{ data: rules }, { data: blocked }] = await Promise.all([
    supabase.from("availability_rules").select("id, day_of_week, start_time, end_time").eq("active", true).order("start_time"),
    supabase
      .from("blocked_times")
      .select("id, start_time, end_time, reason")
      .gt("end_time", new Date().toISOString())
      .order("start_time"),
  ]);

  return (
    <div className="max-w-5xl">
      <Flash code={meldung} />

      {/* Wochenplan als Bild: jeder Tag ein Balken von 7 bis 21 Uhr */}
      <Card icon={Clock} title="Dein Wochenplan" className="mb-10">
        <div className="space-y-2.5">
          <div aria-hidden="true" className="ml-24 flex justify-between text-[0.68rem] text-muted">
            {[7, 9, 11, 13, 15, 17, 19, 21].map((h) => <span key={h}>{h}</span>)}
          </div>
          {order.map((day, i) => {
            const list = (rules ?? []).filter((r) => r.day_of_week === day);
            const pos = (t: string) => {
              const [h, m] = t.split(":").map(Number);
              return Math.min(100, Math.max(0, ((h + m / 60 - 7) / 14) * 100));
            };
            return (
              <div key={day} className="flex items-center gap-3">
                <span className="w-21 shrink-0 text-sm text-espresso">{weekdayLabels[day]}</span>
                <div className="relative h-7 flex-1 rounded-full bg-sand">
                  {list.length === 0 ? <span className="absolute inset-0 flex items-center px-3 text-xs text-muted">geschlossen</span> : null}
                  {list.map((r) => (
                    <span
                      key={r.id}
                      className="anim-grow-x absolute inset-y-0 flex items-center justify-center overflow-hidden rounded-full bg-cocoa text-[0.68rem] text-white"
                      style={{ left: `${pos(r.start_time)}%`, width: `${pos(r.end_time) - pos(r.start_time)}%`, "--delay": `${i * 0.06}s` } as React.CSSProperties}
                    >
                      {short(r.start_time)}–{short(r.end_time)}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <div className="grid gap-10 lg:grid-cols-2">
      <section>
        <h2 className="text-2xl font-light text-espresso">Arbeitszeiten</h2>
        <p className="mt-2 text-muted">
          In diesen Zeiten können Kundinnen online buchen. Für eine Mittagspause trägst du zwei Zeitfenster am selben Tag ein
          (z. B. 10:00–13:00 und 14:00–19:00).
        </p>
        <ul className="mt-6 card divide-y divide-card-line overflow-hidden">
          {order.map((day) => {
            const list = (rules ?? []).filter((r) => r.day_of_week === day);
            return (
              <li key={day} className="flex flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
                <span className="w-28 text-espresso">{weekdayLabels[day]}</span>
                {list.length === 0 ? <span className="text-sm text-muted">geschlossen</span> : null}
                {list.map((r) => (
                  <form key={r.id} action={deleteRule} className="flex items-center gap-2">
                    <input type="hidden" name="id" value={r.id} />
                    <span className="text-espresso">{short(r.start_time)}–{short(r.end_time)}</span>
                    <button type="submit" className="text-xs text-muted underline underline-offset-4 hover:text-espresso" aria-label={`${weekdayLabels[day]} ${short(r.start_time)} bis ${short(r.end_time)} entfernen`}>
                      entfernen
                    </button>
                  </form>
                ))}
              </li>
            );
          })}
        </ul>
        <form action={addRule} className="mt-4 flex flex-wrap items-end gap-3 card p-4">
          <label className="block">
            <span className="label text-muted">Tag</span>
            <select name="day_of_week" className={inputClass}>
              {order.map((d) => <option key={d} value={d}>{weekdayLabels[d]}</option>)}
            </select>
          </label>
          <label className="block"><span className="label text-muted">Von</span><input type="time" name="start_time" required step={900} defaultValue="10:00" className={inputClass} /></label>
          <label className="block"><span className="label text-muted">Bis</span><input type="time" name="end_time" required step={900} defaultValue="19:00" className={inputClass} /></label>
          <button type="submit" className={btnOutline}>Zeitfenster hinzufügen</button>
        </form>
        <p className="mt-3 text-sm text-muted">Hinweis: Die Öffnungszeiten auf der Website (Footer, Kontakt) ändern sich dadurch nicht automatisch.</p>
      </section>

      <section>
        <h2 className="text-2xl font-light text-espresso">Urlaub und Sperrzeiten</h2>
        <p className="mt-2 text-muted">In gesperrten Zeiten kann niemand online buchen. Bestehende Termine bleiben bestehen.</p>
        <Card
          icon={CalendarX}
          className="mt-6"
          bodyClassName="p-4"
          title={<span className="capitalize">{formatMonth(month)}</span>}
          action={
            <span className="flex gap-1 text-sm">
              <Link href={`/admin/availability?monat=${addMonths(month, -1)}`} className="rounded-full px-2 py-1 hover:bg-sand" aria-label="Vorheriger Monat">‹</Link>
              <Link href={`/admin/availability?monat=${addMonths(month, 1)}`} className="rounded-full px-2 py-1 hover:bg-sand" aria-label="Nächster Monat">›</Link>
            </span>
          }
        >
          <MonthGrid
            compact
            month={month}
            today={today}
            href={(d) => `/admin/kalender?ansicht=tag&tag=${d}`}
            dayClass={(d) => {
              const blockedDay = (blocked ?? []).some((b) => dateToLocal(b.start_time, tz).date <= d && dateToLocal(b.end_time, tz).date >= d);
              const weekday = new Date(`${d}T12:00:00Z`).getUTCDay();
              const closed = !(rules ?? []).some((r) => r.day_of_week === weekday);
              return blockedDay ? "!border-caramel !bg-[repeating-linear-gradient(135deg,rgb(199_159_125/0.25)_0_5px,transparent_5px_10px)]" : closed ? "!bg-sand/60 text-muted" : "";
            }}
          />
          <p className="mt-3 flex flex-wrap gap-4 text-xs text-muted">
            <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded border border-caramel bg-[repeating-linear-gradient(135deg,rgb(199_159_125/0.4)_0_3px,transparent_3px_6px)]" /> gesperrt</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-sand ring-1 ring-card-line" /> geschlossen</span>
          </p>
        </Card>
        {(blocked ?? []).length === 0 ? <p className="mt-6 text-muted">Keine Sperrzeiten geplant.</p> : null}
        <ul className="mt-6 card divide-y divide-card-line overflow-hidden">
          {(blocked ?? []).map((b) => (
            <li key={b.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
              <span className="text-espresso">
                {fmtDate(b.start_time)} {fmtTime(b.start_time)} bis {fmtDate(b.end_time)} {fmtTime(b.end_time)}
                {b.reason ? <span className="block text-sm text-muted">{b.reason}</span> : null}
              </span>
              <form action={deleteBlocked}>
                <input type="hidden" name="id" value={b.id} />
                <button type="submit" className="text-sm text-muted underline underline-offset-4 hover:text-espresso">aufheben</button>
              </form>
            </li>
          ))}
        </ul>
        <form action={addBlocked} className="mt-4 space-y-4 card p-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            <div className="flex gap-2">
              <label className="block min-w-0 flex-1"><span className="label text-muted">Von Tag</span><input type="date" name="from_date" required className={inputClass} /></label>
              <label className="block w-32 shrink-0"><span className="label text-muted">Uhrzeit</span><input type="time" name="from_time" step={900} className={inputClass} /></label>
            </div>
            <div className="flex gap-2">
              <label className="block min-w-0 flex-1"><span className="label text-muted">Bis Tag</span><input type="date" name="to_date" required className={inputClass} /></label>
              <label className="block w-32 shrink-0"><span className="label text-muted">Uhrzeit</span><input type="time" name="to_time" step={900} className={inputClass} /></label>
            </div>
          </div>
          <label className="block"><span className="label text-muted">Grund (nur für dich)</span><input name="reason" placeholder="z. B. Urlaub, Fortbildung" className={inputClass} /></label>
          <p className="text-sm text-muted">Ohne Uhrzeit wird der ganze Tag gesperrt.</p>
          <button type="submit" className={btnSolid}>Zeit sperren</button>
        </form>
      </section>
      </div>
    </div>
  );
}
