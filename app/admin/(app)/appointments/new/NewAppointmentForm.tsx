"use client";

import { useActionState } from "react";
import { createAppointment, type NewAppointmentState } from "../../actions";
import { btnSolid, inputClass } from "@/components/admin/ui";

type Service = { id: string; name: string; duration_minutes: number; category: string };
type Customer = { id: string; first_name: string; last_name: string; email: string | null; phone: string | null };

export function NewAppointmentForm({ services, customer, day }: { services: Service[]; customer: Customer | null; day: string }) {
  const [state, action, pending] = useActionState<NewAppointmentState, FormData>(createAppointment, {});
  const v = state.values ?? {};
  const categories = [...new Set(services.map((s) => s.category))];

  return (
    <form action={action} className="max-w-2xl space-y-8">
      {state.message ? (
        <p role="alert" className="border border-espresso bg-white p-4 text-espresso">{state.message}</p>
      ) : null}

      <fieldset className="space-y-5">
        <legend className="text-xl font-light text-espresso">Behandlung und Zeit</legend>
        <label className="block">
          <span className="label text-muted">Behandlung</span>
          <select name="serviceId" required defaultValue={v.serviceId ?? ""} className={inputClass}>
            <option value="" disabled>Bitte wählen</option>
            {categories.map((c) => (
              <optgroup key={c} label={c}>
                {services.filter((s) => s.category === c).map((s) => (
                  <option key={s.id} value={s.id}>{s.name} ({s.duration_minutes} Min.)</option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>
        <div className="grid grid-cols-2 gap-4">
          <label className="block">
            <span className="label text-muted">Datum</span>
            <input type="date" name="date" required defaultValue={v.date ?? day} className={inputClass} />
          </label>
          <label className="block">
            <span className="label text-muted">Uhrzeit</span>
            <input type="time" name="time" required step={900} defaultValue={v.time ?? ""} className={inputClass} />
          </label>
        </div>
        <p className="text-sm text-muted">Die Pause nach der Behandlung wird automatisch eingeplant. Überschneidungen werden verhindert.</p>
      </fieldset>

      <fieldset className="space-y-5">
        <legend className="text-xl font-light text-espresso">Kundin</legend>
        {customer ? (
          <>
            <input type="hidden" name="customerId" value={customer.id} />
            <p className="border border-line bg-white p-4 text-espresso">
              {customer.first_name} {customer.last_name}
              <span className="block text-sm text-muted">{[customer.phone, customer.email].filter(Boolean).join(", ")}</span>
            </p>
          </>
        ) : (
          <>
            <input type="hidden" name="customerId" value="" />
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block"><span className="label text-muted">Vorname</span><input name="firstName" defaultValue={v.firstName} className={inputClass} /></label>
              <label className="block"><span className="label text-muted">Nachname</span><input name="lastName" defaultValue={v.lastName} className={inputClass} /></label>
              <label className="block"><span className="label text-muted">Telefon</span><input name="phone" type="tel" defaultValue={v.phone} className={inputClass} /></label>
              <label className="block"><span className="label text-muted">E-Mail (freiwillig)</span><input name="email" type="email" defaultValue={v.email} className={inputClass} /></label>
            </div>
            <p className="text-sm text-muted">Gibt es die Kundin schon (gleiche E-Mail oder Telefonnummer), wird der Termin ihr zugeordnet.</p>
          </>
        )}
        <label className="block">
          <span className="label text-muted">Interne Notiz (freiwillig)</span>
          <textarea name="notes" rows={3} defaultValue={v.notes} className={`${inputClass} py-2`} />
        </label>
      </fieldset>

      <button type="submit" disabled={pending} className={`${btnSolid} disabled:opacity-60`}>
        {pending ? "Wird gespeichert …" : "Termin eintragen"}
      </button>
    </form>
  );
}
