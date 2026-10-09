import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminTitle, btnOutline, btnSolid, Flash, inputClass, Loading } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin/auth";
import { fmtDate, fmtTime, weekdayLabels } from "@/lib/admin/format";
import { addBlocked, addRule, deleteBlocked, deleteRule } from "../actions";

export const metadata: Metadata = { title: "Zeiten & Urlaub" };

type Props = { searchParams: Promise<{ meldung?: string }> };

export default function AvailabilityPage(props: Props) {
  return (
    <>
      <AdminTitle>Zeiten & Urlaub</AdminTitle>
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
  const { meldung } = await searchParams;
  const [{ data: rules }, { data: blocked }] = await Promise.all([
    supabase.from("availability_rules").select("id, day_of_week, start_time, end_time").eq("active", true).order("start_time"),
    supabase
      .from("blocked_times")
      .select("id, start_time, end_time, reason")
      .gt("end_time", new Date().toISOString())
      .order("start_time"),
  ]);

  return (
    <div className="max-w-3xl">
      <Flash code={meldung} />

      <section>
        <h2 className="text-2xl font-light text-espresso">Arbeitszeiten</h2>
        <p className="mt-2 text-muted">
          In diesen Zeiten können Kundinnen online buchen. Für eine Mittagspause trägst du zwei Zeitfenster am selben Tag ein
          (z. B. 10:00–13:00 und 14:00–19:00).
        </p>
        <ul className="mt-6 divide-y divide-line border-y border-line bg-white">
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
        <form action={addRule} className="mt-4 flex flex-wrap items-end gap-3 border border-line bg-white p-4">
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

      <section className="mt-14">
        <h2 className="text-2xl font-light text-espresso">Urlaub und Sperrzeiten</h2>
        <p className="mt-2 text-muted">In gesperrten Zeiten kann niemand online buchen. Bestehende Termine bleiben bestehen.</p>
        {(blocked ?? []).length === 0 ? <p className="mt-6 text-muted">Keine Sperrzeiten geplant.</p> : null}
        <ul className="mt-6 divide-y divide-line border-y border-line bg-white">
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
        <form action={addBlocked} className="mt-4 space-y-4 border border-line bg-white p-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex gap-2">
              <label className="block flex-1"><span className="label text-muted">Von Tag</span><input type="date" name="from_date" required className={inputClass} /></label>
              <label className="block w-28"><span className="label text-muted">Uhrzeit</span><input type="time" name="from_time" step={900} className={inputClass} /></label>
            </div>
            <div className="flex gap-2">
              <label className="block flex-1"><span className="label text-muted">Bis Tag</span><input type="date" name="to_date" required className={inputClass} /></label>
              <label className="block w-28"><span className="label text-muted">Uhrzeit</span><input type="time" name="to_time" step={900} className={inputClass} /></label>
            </div>
          </div>
          <label className="block"><span className="label text-muted">Grund (nur für dich)</span><input name="reason" placeholder="z. B. Urlaub, Fortbildung" className={inputClass} /></label>
          <p className="text-sm text-muted">Ohne Uhrzeit wird der ganze Tag gesperrt.</p>
          <button type="submit" className={btnSolid}>Zeit sperren</button>
        </form>
      </section>
    </div>
  );
}
