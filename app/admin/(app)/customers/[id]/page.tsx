import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AdminTitle, btnSolid, Flash, inputClass, Loading, StatusBadge } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin/auth";
import { fmtDate, fmtTime } from "@/lib/admin/format";
import { saveCustomer } from "../../actions";

export const metadata: Metadata = { title: "Kundin" };

const months = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];
const euro = (n: number) => new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ meldung?: string }> };

export default function CustomerPage(props: Props) {
  return (
    <Suspense fallback={<Loading />}>
      <Details {...props} />
    </Suspense>
  );
}

async function Details({ params, searchParams }: Props) {
  const { supabase } = await requireAdmin();
  const { id } = await params;
  const { meldung } = await searchParams;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();

  const [{ data: c }, { data: appts }] = await Promise.all([
    supabase.from("customers").select("id, first_name, last_name, email, phone, notes, marketing_consent, birthday_day, birthday_month, created_at").eq("id", id).maybeSingle(),
    supabase
      .from("appointments")
      .select("id, start_time, status, price, services(name)")
      .eq("customer_id", id)
      .order("start_time", { ascending: false })
      .limit(100),
  ]);
  if (!c) notFound();
  const list = (appts ?? []) as unknown as { id: string; start_time: string; status: string; price: number; services: { name: string } | null }[];
  const visits = list.filter((x) => x.status === "completed").length;
  const noShows = list.filter((x) => x.status === "no_show").length;
  const revenue = list.filter((x) => x.status === "completed").reduce((sum, x) => sum + Number(x.price), 0);

  return (
    <div className="max-w-2xl">
      <Flash code={meldung} />
      <AdminTitle action={<Link href={`/admin/appointments/new?kunde=${c.id}`} className={btnSolid}>Neuer Termin</Link>}>
        {c.first_name} {c.last_name}
      </AdminTitle>
      <p className="-mt-4 mb-8 text-sm text-muted">
        Kundin seit {fmtDate(c.created_at, { month: "long", year: "numeric" })}, {visits} Besuche, {euro(revenue)} Umsatz
        {noShows ? `, ${noShows}× nicht erschienen` : ""}
        {c.birthday_day ? `, Geburtstag ${c.birthday_day}. ${months[c.birthday_month - 1]}` : ""}
      </p>

      <form action={saveCustomer} className="space-y-4 card p-5">
        <input type="hidden" name="id" value={c.id} />
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block"><span className="label text-muted">Vorname</span><input name="first_name" required defaultValue={c.first_name} className={inputClass} /></label>
          <label className="block"><span className="label text-muted">Nachname</span><input name="last_name" required defaultValue={c.last_name} className={inputClass} /></label>
          <label className="block"><span className="label text-muted">Telefon</span><input name="phone" type="tel" defaultValue={c.phone ?? ""} className={inputClass} /></label>
          <label className="block"><span className="label text-muted">E-Mail</span><input name="email" type="email" defaultValue={c.email ?? ""} className={inputClass} /></label>
        </div>
        <label className="block">
          <span className="label text-muted">Notizen (Hauttyp, Vorlieben …)</span>
          <textarea name="notes" rows={4} defaultValue={c.notes ?? ""} className={`${inputClass} py-2`} />
        </label>
        <p className="text-sm text-muted">Gesundheitsangaben nur, wenn nötig und mit Einverständnis der Kundin.</p>
        <fieldset>
          <legend className="label text-muted">Geburtstag (ohne Jahr)</legend>
          <div className="mt-1.5 flex gap-2">
            <select name="birthday_day" defaultValue={c.birthday_day ?? ""} aria-label="Tag" className={`${inputClass} mt-0 w-24`}>
              <option value="">Tag</option>
              {Array.from({ length: 31 }, (_, i) => <option key={i + 1} value={i + 1}>{i + 1}.</option>)}
            </select>
            <select name="birthday_month" defaultValue={c.birthday_month ?? ""} aria-label="Monat" className={`${inputClass} mt-0 flex-1`}>
              <option value="">Monat</option>
              {months.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
            </select>
          </div>
        </fieldset>
        <label className="flex items-start gap-3 text-sm text-muted">
          <input type="checkbox" name="marketing_consent" defaultChecked={c.marketing_consent} className="mt-0.5 h-5 w-5 shrink-0 accent-espresso" />
          <span>Möchte Angebote und Geburtstagsgrüße per E-Mail/SMS. Nur anhaken, wenn die Kundin ausdrücklich zugestimmt hat.</span>
        </label>
        <button type="submit" className={btnSolid}>Speichern</button>
      </form>

      <h2 className="mt-10 text-xl font-light text-espresso">Termine</h2>
      {list.length === 0 ? <p className="mt-4 text-muted">Noch keine Termine.</p> : null}
      <ul className="mt-4 card divide-y divide-card-line overflow-hidden">
        {list.map((x) => (
          <li key={x.id}>
            <Link href={`/admin/appointments/${x.id}`} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 hover:bg-sand/60">
              <span className="w-32 text-sm text-espresso">{fmtDate(x.start_time)}, {fmtTime(x.start_time)}</span>
              <span className="min-w-0 flex-1 text-sm text-muted">{x.services?.name}</span>
              <StatusBadge status={x.status} />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
