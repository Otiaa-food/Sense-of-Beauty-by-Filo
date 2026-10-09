"use server";

import { redirect } from "next/navigation";
import { parseBooking, type BookingFormState } from "@/lib/booking/schema";
import { bookingConfigured, isSlotFree, loadBookableService } from "@/lib/booking/server";
import { createAdminClient } from "@/lib/supabase/admin";

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

  const token = (data as { manage_token: string }).manage_token;
  redirect(`/termin/${token}?neu=1`);
}
