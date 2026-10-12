import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminTitle, btnOutline, Flash, Loading } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin/auth";
import { dateToLocal } from "@/lib/admin/time";
import { fmtDate, fmtDayKey, fmtTime } from "@/lib/admin/format";
import { brand } from "@/lib/brand.config";
import { describeWindow } from "@/lib/waitlist";
import { checkWaitlistDay, removeWaitlistEntry } from "../actions";

export const metadata: Metadata = { title: "Warteliste" };

type Props = { searchParams: Promise<{ meldung?: string }> };

export default function WaitlistPage(props: Props) {
  return (
    <>
      <AdminTitle>Warteliste</AdminTitle>
      <Suspense fallback={<Loading />}>
        <Content {...props} />
      </Suspense>
    </>
  );
}

type Row = {
  id: string;
  desired_date: string;
  time_from: string;
  time_to: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  status: string;
  notified_at: string | null;
  created_at: string;
  services: { name: string } | null;
};

async function Content({ searchParams }: Props) {
  const { supabase } = await requireAdmin();
  const { meldung } = await searchParams;
  const today = dateToLocal(new Date(), brand.timezone).date;
  const [{ data }, { count: booked }] = await Promise.all([
    supabase
      .from("waitlist")
      .select("id, desired_date, time_from, time_to, first_name, last_name, email, phone, status, notified_at, created_at, services(name)")
      .in("status", ["waiting", "notified"])
      .gte("desired_date", today)
      .order("desired_date")
      .order("created_at"),
    supabase.from("waitlist").select("id", { count: "exact", head: true }).eq("status", "booked"),
  ]);
  const rows = (data ?? []) as unknown as Row[];
  const byDay = new Map<string, Row[]>();
  for (const r of rows) byDay.set(r.desired_date, [...(byDay.get(r.desired_date) ?? []), r]);

  return (
    <div className="max-w-3xl">
      <Flash code={meldung} />
      <p className="text-muted">
        Kundinnen tragen sich beim Buchen selbst ein. Sagt jemand ab, bekommen alle Passenden für diesen Tag automatisch eine SMS
        „Hey Beauty, dein Termin ist verfügbar“ (und eine E-Mail, falls angegeben). Wer zuerst bucht, bekommt den Termin.
      </p>
      {booked ? (
        <p className="mt-3 text-sm text-muted">
          Bisher {booked}× über die Warteliste gebucht.
        </p>
      ) : null}

      {byDay.size === 0 ? <p className="mt-8 card p-5 text-muted">Gerade steht niemand auf der Warteliste.</p> : null}

      <div className="mt-8 space-y-10">
        {[...byDay.entries()].map(([day, list]) => (
          <section key={day}>
            <div className="flex flex-wrap items-end justify-between gap-3">
              <h2 className="text-xl font-light text-espresso">{fmtDayKey(day)}</h2>
              <form action={checkWaitlistDay}>
                <input type="hidden" name="day" value={day} />
                <button type="submit" className={btnOutline}>Freie Zeit jetzt prüfen</button>
              </form>
            </div>
            <ul className="mt-3 card divide-y divide-card-line overflow-hidden">
              {list.map((r) => (
                <li key={r.id} className="flex flex-wrap items-start justify-between gap-3 px-4 py-4">
                  <div className="min-w-0">
                    <p className="text-espresso">
                      {r.first_name} {r.last_name}
                    </p>
                    <p className="mt-1 text-sm text-muted">
                      {r.services?.name}, {describeWindow(r.time_from, r.time_to)}
                    </p>
                    <p className="mt-1 text-sm">
                      {r.phone ? (
                        <a href={`tel:${r.phone}`} className="text-espresso underline underline-offset-4">
                          {r.phone}
                        </a>
                      ) : null}
                      {r.email ? <span className="ml-3 text-muted">{r.email}</span> : null}
                    </p>
                    <p className="label mt-2 !text-[0.6rem] text-muted">
                      {r.status === "notified" && r.notified_at
                        ? `Benachrichtigt ${fmtDate(r.notified_at, { day: "numeric", month: "short" })}, ${fmtTime(r.notified_at)}`
                        : `Wartet seit ${fmtDate(r.created_at, { day: "numeric", month: "short" })}`}
                    </p>
                  </div>
                  <form action={removeWaitlistEntry}>
                    <input type="hidden" name="id" value={r.id} />
                    <button type="submit" className="text-sm text-muted underline underline-offset-4 hover:text-espresso">
                      Entfernen
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
