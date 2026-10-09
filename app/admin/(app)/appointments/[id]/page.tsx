import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AdminTitle, btnOutline, btnSolid, Flash, inputClass, Loading, StatusBadge } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin/auth";
import { fmtDate, fmtTime, sourceLabels } from "@/lib/admin/format";
import { dateToLocal } from "@/lib/admin/time";
import { brand } from "@/lib/brand.config";
import { formatPrice } from "@/lib/catalog";
import { rescheduleAppointment, saveAppointmentNotes, setAppointmentStatus } from "../../actions";

export const metadata: Metadata = { title: "Termin" };

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ meldung?: string }> };

export default function AppointmentPage(props: Props) {
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

  const { data: a } = await supabase
    .from("appointments")
    .select("id, start_time, end_time, blocked_until, status, price, source, customer_notes, internal_notes, created_at, cancelled_at, services(name), customers(id, first_name, last_name, email, phone)")
    .eq("id", id)
    .maybeSingle();
  if (!a) notFound();

  const service = a.services as unknown as { name: string } | null;
  const c = a.customers as unknown as { id: string; first_name: string; last_name: string; email: string | null; phone: string | null } | null;
  const local = dateToLocal(a.start_time, brand.timezone);
  const active = a.status === "confirmed" || a.status === "pending";
  const statusButton = (status: string, label: string, solid = false) => (
    <form action={setAppointmentStatus}>
      <input type="hidden" name="id" value={a.id} />
      <input type="hidden" name="status" value={status} />
      <button type="submit" className={solid ? btnSolid : btnOutline}>{label}</button>
    </form>
  );

  return (
    <div className="max-w-2xl">
      <Flash code={meldung} />
      <Link href={`/admin?tag=${local.date}`} className="label text-muted underline underline-offset-4">Zum Kalender</Link>
      <div className="mt-4">
        <AdminTitle action={<StatusBadge status={a.status} />}>{service?.name ?? "Termin"}</AdminTitle>
      </div>

      <dl className="divide-y divide-line border-y border-line bg-white">
        {[
          ["Wann", `${fmtDate(a.start_time, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}, ${fmtTime(a.start_time)}–${fmtTime(a.end_time)} Uhr`],
          ["Pause bis", `${fmtTime(a.blocked_until)} Uhr`],
          ["Preis", formatPrice(Number(a.price))],
          ["Gebucht", `${sourceLabels[a.source] ?? a.source}, ${fmtDate(a.created_at)}`],
        ].map(([k, v]) => (
          <div key={k} className="grid grid-cols-[6.5rem_1fr] gap-4 px-4 py-3">
            <dt className="label pt-0.5 text-muted">{k}</dt>
            <dd className="text-espresso">{v}</dd>
          </div>
        ))}
        {c ? (
          <div className="grid grid-cols-[6.5rem_1fr] gap-4 px-4 py-3">
            <dt className="label pt-0.5 text-muted">Kundin</dt>
            <dd className="text-espresso">
              <Link href={`/admin/customers/${c.id}`} className="underline underline-offset-4">{c.first_name} {c.last_name}</Link>
              {c.phone ? <a href={`tel:${c.phone.replace(/\s/g, "")}`} className="block text-sm text-muted">{c.phone}</a> : null}
              {c.email ? <a href={`mailto:${c.email}`} className="block text-sm text-muted">{c.email}</a> : null}
            </dd>
          </div>
        ) : null}
        {a.customer_notes ? (
          <div className="grid grid-cols-[6.5rem_1fr] gap-4 px-4 py-3">
            <dt className="label pt-0.5 text-muted">Anmerkung</dt>
            <dd className="whitespace-pre-line text-espresso">{a.customer_notes}</dd>
          </div>
        ) : null}
      </dl>

      <h2 className="mt-10 text-xl font-light text-espresso">Status</h2>
      <div className="mt-4 flex flex-wrap gap-2">
        {active ? (
          <>
            {statusButton("completed", "Erschienen", true)}
            {statusButton("no_show", "Nicht erschienen")}
            {statusButton("cancelled", "Absagen")}
          </>
        ) : (
          statusButton("confirmed", "Wieder bestätigen")
        )}
      </div>

      {active ? (
        <>
          <h2 className="mt-10 text-xl font-light text-espresso">Verschieben</h2>
          <form action={rescheduleAppointment} className="mt-4 flex flex-wrap items-end gap-3">
            <input type="hidden" name="id" value={a.id} />
            <label className="block"><span className="label text-muted">Datum</span><input type="date" name="date" required defaultValue={local.date} className={inputClass} /></label>
            <label className="block"><span className="label text-muted">Uhrzeit</span><input type="time" name="time" required step={900} defaultValue={local.time} className={inputClass} /></label>
            <button type="submit" className={btnOutline}>Verschieben</button>
          </form>
        </>
      ) : null}

      <h2 className="mt-10 text-xl font-light text-espresso">Interne Notiz</h2>
      <form action={saveAppointmentNotes} className="mt-4">
        <input type="hidden" name="id" value={a.id} />
        <textarea name="internal_notes" rows={4} defaultValue={a.internal_notes ?? ""} className={`${inputClass} py-2`} aria-label="Interne Notiz" />
        <p className="mt-2 text-sm text-muted">Nur für dich sichtbar. Bitte keine Gesundheitsdaten notieren, die nicht nötig sind.</p>
        <button type="submit" className={`${btnSolid} mt-3`}>Notiz speichern</button>
      </form>
    </div>
  );
}
