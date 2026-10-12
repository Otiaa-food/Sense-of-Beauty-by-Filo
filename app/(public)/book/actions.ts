"use server";

import { redirect } from "next/navigation";
import { after } from "next/server";
import { parseBooking, type BookingFormState } from "@/lib/booking/schema";
import { localDateKey } from "@/lib/booking/availability";
import { bookingConfigured, isSlotFree, loadBookableService, loadSettings } from "@/lib/booking/server";
import { brand } from "@/lib/brand.config";
import { notifyBooked } from "@/lib/notify/dispatch";
import { markWaitlistBooked } from "@/lib/notify/outreach";
import { normalizePhone } from "@/lib/notify/phone";
import { createAdminClient } from "@/lib/supabase/admin";
import { parseWaitlist, windowFor, type WaitlistFormState } from "@/lib/waitlist";

const messages: Record<string, string> = {
  slot_taken: "Diese Uhrzeit wurde gerade vergeben. Bitte wähle eine andere.",
  slot_blocked: "Diese Uhrzeit ist leider nicht verfügbar. Bitte wähle eine andere.",
  service_unavailable: "Diese Behandlung ist online gerade nicht buchbar. Bitte ruf im Studio an.",
};

/** Termin anlegen. Prüft alles auf dem Server, die Datenbank verhindert zusätzlich Doppelbuchungen. */
export async function createBooking(_prev: BookingFormState, formData: FormData): Promise<BookingFormState> {
  const values = {
    firstName: String(formData.get("firstName") ?? ""),
    lastName: String(formData.get("lastName") ?? ""),
    email: String(formData.get("email") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    notes: String(formData.get("notes") ?? ""),
    birthdayDay: String(formData.get("birthdayDay") ?? ""),
    birthdayMonth: String(formData.get("birthdayMonth") ?? ""),
  };

  if (!bookingConfigured()) {
    return { ok: false, values, message: "Die Online-Buchung ist gerade noch nicht freigeschaltet. Bitte ruf im Studio an." };
  }

  const parsed = parseBooking(formData);
  if (parsed.spam) return { ok: false, values, message: "Bitte versuche es noch einmal." };
  if (!parsed.ok) return { ok: false, values, fieldErrors: parsed.fieldErrors };
  const input = parsed.data;

  const service = await loadBookableService(input.service);
  if (!service) return { ok: false, values, message: messages.service_unavailable };

  const start = new Date(input.start);
  if (!(await isSlotFree(service, start))) {
    return { ok: false, values, message: messages.slot_taken };
  }

  const admin = createAdminClient();
  const { data, error } = await admin.rpc("create_booking", {
    p_service_id: service.id,
    p_start: start.toISOString(),
    p_first_name: input.firstName,
    p_last_name: input.lastName,
    p_email: input.email,
    p_phone: input.phone,
    p_customer_notes: input.notes || null,
    p_marketing_consent: input.marketing === "on",
    p_status: "confirmed",
  });

  if (error) {
    const key = Object.keys(messages).find((k) => error.message.includes(k));
    if (!key) console.error("Buchung fehlgeschlagen:", error);
    return { ok: false, values, message: key ? messages[key] : "Etwas ist schiefgelaufen. Bitte versuche es noch einmal." };
  }

  const created = data as { id: string; manage_token: string; customer_id: string };

  // Geburtstag (freiwillig) nur ergänzen, wenn noch keiner hinterlegt ist
  if (input.birthdayDay !== "" && input.birthdayMonth !== "") {
    await admin
      .from("customers")
      .update({ birthday_day: input.birthdayDay, birthday_month: input.birthdayMonth })
      .eq("id", created.customer_id)
      .is("birthday_day", null);
  }
  // Stand sie für diesen Tag auf der Warteliste, ist das jetzt erledigt
  after(() =>
    markWaitlistBooked(service.id, localDateKey(start, brand.timezone), input.email, input.phone).catch((e) =>
      console.error("Warteliste aktualisieren fehlgeschlagen:", e),
    ),
  );
  // E-Mails erst nach der Antwort verschicken: die Kundin wartet nicht darauf
  after(() => notifyBooked(created.id).catch((e) => console.error("Bestätigung fehlgeschlagen:", e)));
  redirect(`/termin/${created.manage_token}?neu=1`);
}

/** Auf die Warteliste setzen. Gleiche Nummer, gleiche Behandlung, gleicher Tag: Eintrag wird aktualisiert. */
export async function joinWaitlist(_prev: WaitlistFormState, formData: FormData): Promise<WaitlistFormState> {
  if (!bookingConfigured()) return { ok: false, message: "Die Warteliste ist gerade noch nicht freigeschaltet. Bitte ruf im Studio an." };
  const parsed = parseWaitlist(formData);
  if (parsed.spam) return { ok: false, message: "Bitte versuche es noch einmal." };
  if (!parsed.ok) return { ok: false, fieldErrors: parsed.fieldErrors };
  const input = parsed.data;

  const phone = normalizePhone(input.phone);
  if (!phone) return { ok: false, fieldErrors: { phone: "Bitte gib eine Handynummer an, damit wir dir eine SMS schicken können." } };

  const service = await loadBookableService(input.service);
  if (!service) return { ok: false, message: messages.service_unavailable };

  // Wunschtag muss im buchbaren Zeitraum liegen (heute bis maximale Vorausbuchung)
  const settings = await loadSettings();
  const today = localDateKey(new Date(), settings.timezone);
  const last = localDateKey(new Date(Date.now() + settings.maxDaysAhead * 24 * 3600_000), settings.timezone);
  if (input.date < today || input.date > last) return { ok: false, fieldErrors: { date: "Bitte wähle einen Tag in den nächsten Wochen." } };

  const window = windowFor(input.window)!;
  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("waitlist")
    .select("id")
    .eq("phone", phone)
    .in("status", ["waiting", "notified"])
    .limit(10);
  const row = {
    service_id: service.id,
    desired_date: input.date,
    time_from: window.from,
    time_to: window.to,
    first_name: input.firstName,
    last_name: input.lastName,
    phone,
    email: input.email ? input.email.toLowerCase() : null,
    status: "waiting",
  };
  const { data: same } = await admin
    .from("waitlist")
    .select("id")
    .eq("phone", phone)
    .eq("service_id", service.id)
    .eq("desired_date", input.date)
    .in("status", ["waiting", "notified"])
    .maybeSingle();
  if (!same && (existing?.length ?? 0) >= 5) {
    return { ok: false, message: "Du stehst schon für mehrere Tage auf der Warteliste. Ruf gerne im Studio an." };
  }
  const { error } = same ? await admin.from("waitlist").update(row).eq("id", same.id) : await admin.from("waitlist").insert(row);
  if (error) {
    console.error("Warteliste fehlgeschlagen:", error);
    return { ok: false, message: "Etwas ist schiefgelaufen. Bitte versuche es noch einmal." };
  }
  return { ok: true };
}
