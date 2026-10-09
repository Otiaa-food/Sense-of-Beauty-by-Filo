import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AdminTitle, btnSolid, Loading, StatusBadge } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin/auth";
import { fmtDate, fmtTime } from "@/lib/admin/format";
import { dateToLocal } from "@/lib/admin/time";
import { brand } from "@/lib/brand.config";

export const metadata: Metadata = { title: "Termine" };

type Props = { searchParams: Promise<{ ansicht?: string }> };

export default function AppointmentsPage(props: Props) {
  return (
    <>
      <AdminTitle action={<Link href="/admin/appointments/new" className={btnSolid}>Termin eintragen</Link>}>Termine</AdminTitle>
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
  const { ansicht } = await searchParams;
  const past = ansicht === "vergangen";
  const now = new Date().toISOString();
  let q = supabase
    .from("appointments")
    .select("id, start_time, status, source, services(name), customers(first_name, last_name)")
    .limit(200);
  q = past ? q.lt("start_time", now).order("start_time", { ascending: false }) : q.gte("start_time", now).order("start_time");
  const { data } = await q;
  const rows = (data ?? []) as unknown as Row[];

  // nach Tagen gruppieren
  const groups = new Map<string, Row[]>();
  for (const r of rows) {
    const key = dateToLocal(r.start_time, brand.timezone).date;
    groups.set(key, [...(groups.get(key) ?? []), r]);
  }

  return (
    <>
      <div className="mb-6 flex gap-4 text-sm">
        <Link href="/admin/appointments" aria-current={!past ? "page" : undefined} className="text-muted aria-[current=page]:text-espresso aria-[current=page]:underline underline-offset-4">Kommende</Link>
        <Link href="/admin/appointments?ansicht=vergangen" aria-current={past ? "page" : undefined} className="text-muted aria-[current=page]:text-espresso aria-[current=page]:underline underline-offset-4">Vergangene</Link>
      </div>
      {rows.length === 0 ? <p className="text-muted">Keine Termine.</p> : null}
      <div className="space-y-8">
        {[...groups.entries()].map(([key, list]) => (
          <section key={key}>
            <h2 className="label text-muted">{fmtDate(list[0].start_time, { weekday: "long", day: "numeric", month: "long" })}</h2>
            <ul className="mt-2 divide-y divide-line border-y border-line bg-white">
              {list.map((r) => (
                <li key={r.id}>
                  <Link href={`/admin/appointments/${r.id}`} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 hover:bg-paper">
                    <span className="w-12 text-espresso">{fmtTime(r.start_time)}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-espresso">{r.customers ? `${r.customers.first_name} ${r.customers.last_name}` : "Unbekannt"}</span>
                      <span className="block text-sm text-muted">{r.services?.name}</span>
                    </span>
                    <StatusBadge status={r.status} />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </>
  );
}
