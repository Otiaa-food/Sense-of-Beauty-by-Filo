"use server";

import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/auth";
import { localToDate } from "@/lib/admin/time";
import { brand } from "@/lib/brand.config";
import { notifyBooked, notifyCancelled, notifyRescheduled } from "@/lib/notify/dispatch";

/**
 * Alle Aktionen im Admin-Bereich. Jede prüft zuerst requireAdmin() und arbeitet dann
 * im Namen der eingeloggten Person (Row Level Security bleibt aktiv).
 * Rückmeldung über ?meldung=… in der Adresse.
 */

const tz = brand.timezone;
const uuid = z.uuid();
const back = (path: string, code: string) => redirect(`${path}${path.includes("?") ? "&" : "?"}meldung=${code}`);
const isOverlap = (e: { code?: string; message?: string } | null) =>
  Boolean(e && (e.code === "23P01" || e.message?.includes("appointments_no_overlap")));

// ---------- Termin neu ----------

export type NewAppointmentState = { message?: string; values?: Record<string, string> };

const newSchema = z.object({
  serviceId: uuid,
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  customerId: z.union([uuid, z.literal("")]),
  firstName: z.string().trim().max(80),
  lastName: z.string().trim().max(80),
  email: z.union([z.email(), z.literal("")]),
  phone: z.string().trim().max(30),
  notes: z.string().trim().max(1000),
});

export async function createAppointment(_prev: NewAppointmentState, formData: FormData): Promise<NewAppointmentState> {
  const { supabase } = await requireAdmin();
  const values = Object.fromEntries(
    ["serviceId", "date", "time", "customerId", "firstName", "lastName", "email", "phone", "notes"].map((k) => [
      k,
      String(formData.get(k) ?? "").trim(),
    ]),
  );
  const parsed = newSchema.safeParse(values);
  if (!parsed.success) return { values, message: "Bitte Behandlung, Datum, Uhrzeit und Kontaktdaten prüfen." };
  const v = parsed.data;
  if (!v.customerId && (!v.firstName || !v.lastName)) return { values, message: "Bitte Vor- und Nachnamen eintragen." };

  const start = localToDate(v.date, v.time, tz);
  if (!start) return { values, message: "Bitte Datum und Uhrzeit prüfen." };

  const { data: service } = await supabase
    .from("services")
    .select("id, duration_minutes, buffer_minutes, price")
    .eq("id", v.serviceId)
    .maybeSingle();
  if (!service) return { values, message: "Behandlung nicht gefunden." };

  // Kundin: gewählt, per E-Mail oder Telefon gefunden, sonst neu angelegt
  let customerId = v.customerId;
  if (!customerId && v.email) {
    const { data } = await supabase.from("customers").select("id").ilike("email", v.email).maybeSingle();
    customerId = data?.id ?? "";
  }
  if (!customerId && v.phone) {
    const { data } = await supabase.from("customers").select("id").eq("phone", v.phone).limit(1).maybeSingle();
    customerId = data?.id ?? "";
  }
  if (!customerId) {
    const { data, error } = await supabase
      .from("customers")
      .insert({ first_name: v.firstName, last_name: v.lastName, email: v.email || null, phone: v.phone || null })
      .select("id")
      .single();
    if (error) return { values, message: "Kundin konnte nicht angelegt werden." };
    customerId = data.id;
  }

  const end = new Date(start.getTime() + service.duration_minutes * 60_000);
  const blockedUntil = new Date(end.getTime() + service.buffer_minutes * 60_000);
  const { data: appt, error } = await supabase
    .from("appointments")
    .insert({
      customer_id: customerId,
      service_id: service.id,
      start_time: start.toISOString(),
      end_time: end.toISOString(),
      blocked_until: blockedUntil.toISOString(),
      status: "confirmed",
      price: service.price,
      internal_notes: v.notes || null,
      source: "admin",
    })
    .select("id")
    .single();
  if (isOverlap(error)) return { values, message: "Das überschneidet sich mit einem anderen Termin (inklusive Pause). Bitte andere Zeit wählen." };
  if (error || !appt) return { values, message: "Der Termin konnte nicht gespeichert werden." };

  // Bestätigung an die Kundin, wenn sie eine E-Mail hat und Filo das möchte
  if (formData.get("notify") === "on") {
    after(() => notifyBooked(appt.id).catch((e) => console.error("Bestätigung fehlgeschlagen:", e)));
  }

  redirect(`/admin/appointments/${appt.id}?meldung=angelegt`);
}

// ---------- Termin ändern ----------

export async function setAppointmentStatus(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = String(formData.get("id"));
  const status = String(formData.get("status"));
  if (!uuid.safeParse(id).success || !["confirmed", "completed", "cancelled", "no_show"].includes(status)) {
    back("/admin", "ungueltig");
  }
  const patch: Record<string, unknown> = { status };
  if (status === "cancelled") {
    patch.cancelled_at = new Date().toISOString();
    patch.cancel_reason = "Im Admin abgesagt";
  }
  const { error } = await supabase.from("appointments").update(patch).eq("id", id);
  if (!error && status === "cancelled" && formData.get("notify") === "on") {
    after(() => notifyCancelled(id, { byCustomer: false }).catch((e) => console.error("Absage-Mail fehlgeschlagen:", e)));
  }
  // Wieder bestätigen kann an einer Überschneidung scheitern (Zeit inzwischen vergeben)
  back(`/admin/appointments/${id}`, isOverlap(error) ? "ueberschneidung" : error ? "fehler" : "status");
}

export async function rescheduleAppointment(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = String(formData.get("id"));
  const start = localToDate(String(formData.get("date")), String(formData.get("time")), tz);
  if (!uuid.safeParse(id).success || !start) back(`/admin/appointments/${id}`, "ungueltig");

  const { data: appt } = await supabase
    .from("appointments")
    .select("start_time, end_time, blocked_until")
    .eq("id", id)
    .maybeSingle();
  if (!appt) back("/admin", "fehler");

  // Dauer und Pause bleiben wie beim ursprünglichen Termin
  const duration = Date.parse(appt!.end_time) - Date.parse(appt!.start_time);
  const buffer = Date.parse(appt!.blocked_until) - Date.parse(appt!.end_time);
  const end = new Date(start!.getTime() + duration);
  const { error } = await supabase
    .from("appointments")
    .update({
      start_time: start!.toISOString(),
      end_time: end.toISOString(),
      blocked_until: new Date(end.getTime() + buffer).toISOString(),
    })
    .eq("id", id);
  if (!error && formData.get("notify") === "on") {
    after(() => notifyRescheduled(id).catch((e) => console.error("Verschiebe-Mail fehlgeschlagen:", e)));
  }
  back(`/admin/appointments/${id}`, isOverlap(error) ? "ueberschneidung" : error ? "fehler" : "verschoben");
}

export async function saveAppointmentNotes(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = String(formData.get("id"));
  const notes = String(formData.get("internal_notes") ?? "").trim().slice(0, 2000);
  if (!uuid.safeParse(id).success) back("/admin", "ungueltig");
  const { error } = await supabase.from("appointments").update({ internal_notes: notes || null }).eq("id", id);
  back(`/admin/appointments/${id}`, error ? "fehler" : "gespeichert");
}

// ---------- Kundinnen ----------

const customerSchema = z.object({
  id: uuid,
  first_name: z.string().trim().min(1).max(80),
  last_name: z.string().trim().min(1).max(80),
  email: z.union([z.email(), z.literal("")]),
  phone: z.string().trim().max(30),
  notes: z.string().trim().max(5000),
});

export async function saveCustomer(formData: FormData) {
  const { supabase } = await requireAdmin();
  const parsed = customerSchema.safeParse(Object.fromEntries(formData));
  const id = String(formData.get("id"));
  if (!parsed.success) back(`/admin/customers/${id}`, "ungueltig");
  const c = parsed.data!;
  const { error } = await supabase
    .from("customers")
    .update({ first_name: c.first_name, last_name: c.last_name, email: c.email || null, phone: c.phone || null, notes: c.notes || null })
    .eq("id", c.id);
  back(`/admin/customers/${c.id}`, error ? "fehler" : "gespeichert");
}

// ---------- Behandlungen ----------

const serviceSchema = z.object({
  id: uuid,
  price: z.coerce.number().min(0).max(10000),
  duration_minutes: z.coerce.number().int().min(5).max(600),
  buffer_minutes: z.coerce.number().int().min(0).max(240),
  rebook_after_days: z.union([z.literal(""), z.coerce.number().int().min(7).max(365)]),
});

export async function saveService(formData: FormData) {
  const { supabase } = await requireAdmin();
  const parsed = serviceSchema.safeParse({
    id: formData.get("id"),
    price: String(formData.get("price") ?? "").replace(",", "."),
    duration_minutes: formData.get("duration_minutes"),
    buffer_minutes: formData.get("buffer_minutes"),
    rebook_after_days: String(formData.get("rebook_after_days") ?? ""),
  });
  if (!parsed.success) back("/admin/services", "ungueltig");
  const s = parsed.data!;
  const { error } = await supabase
    .from("services")
    .update({
      price: s.price,
      duration_minutes: s.duration_minutes,
      buffer_minutes: s.buffer_minutes,
      rebook_after_days: s.rebook_after_days === "" ? null : s.rebook_after_days,
      online_booking_enabled: formData.get("online_booking_enabled") === "on",
      active: formData.get("active") === "on",
    })
    .eq("id", s.id);
  // Website-Zwischenspeicher für Preise und Behandlungen sofort erneuern
  updateTag("catalog");
  back(`/admin/services#s-${s.id}`, error ? "fehler" : "gespeichert");
}

// ---------- Arbeitszeiten und Sperrzeiten ----------

export async function addRule(formData: FormData) {
  const { supabase } = await requireAdmin();
  const day = Number(formData.get("day_of_week"));
  const start = String(formData.get("start_time"));
  const end = String(formData.get("end_time"));
  if (!(day >= 0 && day <= 6) || !/^\d{2}:\d{2}$/.test(start) || !/^\d{2}:\d{2}$/.test(end) || end <= start) {
    back("/admin/availability", "ungueltig");
  }
  const { error } = await supabase.from("availability_rules").insert({ day_of_week: day, start_time: start, end_time: end });
  back("/admin/availability", error ? "fehler" : "gespeichert");
}

export async function deleteRule(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = String(formData.get("id"));
  if (!uuid.safeParse(id).success) back("/admin/availability", "ungueltig");
  const { error } = await supabase.from("availability_rules").delete().eq("id", id);
  back("/admin/availability", error ? "fehler" : "geloescht");
}

export async function addBlocked(formData: FormData) {
  const { supabase } = await requireAdmin();
  const start = localToDate(String(formData.get("from_date")), String(formData.get("from_time") || "00:00"), tz);
  const end = localToDate(String(formData.get("to_date")), String(formData.get("to_time") || "23:59"), tz);
  const reason = String(formData.get("reason") ?? "").trim().slice(0, 200);
  if (!start || !end || end <= start) back("/admin/availability", "ungueltig");
  const { error } = await supabase
    .from("blocked_times")
    .insert({ start_time: start!.toISOString(), end_time: end!.toISOString(), reason: reason || null });
  back("/admin/availability", error ? "fehler" : "gespeichert");
}

export async function deleteBlocked(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = String(formData.get("id"));
  if (!uuid.safeParse(id).success) back("/admin/availability", "ungueltig");
  const { error } = await supabase.from("blocked_times").delete().eq("id", id);
  back("/admin/availability", error ? "fehler" : "geloescht");
}

// ---------- Bewertungen ----------

const rating = z.coerce.number().min(1).max(5);
const optionalRating = z.union([z.literal(""), rating]);
const optionalCount = z.union([z.literal(""), z.coerce.number().int().min(0).max(100000)]);

export async function saveReviewSummary(formData: FormData) {
  const { supabase } = await requireAdmin();
  const get = (k: string) => String(formData.get(k) ?? "").trim().replace(",", ".");
  const parsed = z
    .object({
      google_rating: optionalRating,
      google_count: optionalCount,
      planity_rating: optionalRating,
      planity_count: optionalCount,
      planity_url: z.union([z.literal(""), z.url()]),
    })
    .safeParse({
      google_rating: get("google_rating"),
      google_count: get("google_count"),
      planity_rating: get("planity_rating"),
      planity_count: get("planity_count"),
      planity_url: String(formData.get("planity_url") ?? "").trim(),
    });
  if (!parsed.success) back("/admin/reviews", "ungueltig");
  const v = parsed.data!;
  const n = (x: number | "") => (x === "" ? null : x);
  const { error } = await supabase.from("settings").upsert({
    key: "review_summary",
    is_public: true,
    value: {
      google: { rating: n(v.google_rating), count: n(v.google_count) },
      planity: { rating: n(v.planity_rating), count: n(v.planity_count), url: v.planity_url },
    },
  });
  updateTag("reviews");
  back("/admin/reviews", error ? "fehler" : "gespeichert");
}

export async function addReview(formData: FormData) {
  const { supabase } = await requireAdmin();
  const parsed = z
    .object({
      author_name: z.string().trim().min(1).max(80),
      rating,
      text: z.string().trim().max(1200),
      source: z.enum(["google", "planity", "manual"]),
      review_date: z.union([z.literal(""), z.string().regex(/^\d{4}-\d{2}-\d{2}$/)]),
    })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) back("/admin/reviews", "ungueltig");
  const v = parsed.data!;
  const consent = formData.get("consent") === "on";
  const { error } = await supabase.from("reviews").insert({
    author_name: v.author_name,
    rating: Math.round(v.rating),
    text: v.text || null,
    source: v.source,
    review_date: v.review_date || null,
    consent_confirmed_at: consent ? new Date().toISOString() : null,
    visible: consent && formData.get("visible") === "on",
  });
  updateTag("reviews");
  back("/admin/reviews", error ? "fehler" : "gespeichert");
}

export async function setReviewVisible(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = String(formData.get("id"));
  if (!uuid.safeParse(id).success) back("/admin/reviews", "ungueltig");
  const visible = formData.get("visible") === "true";
  const patch: Record<string, unknown> = { visible };
  // Einwilligung bestätigen, wenn Filo sie beim Freigeben angehakt hat
  if (visible && formData.get("consent") === "on") patch.consent_confirmed_at = new Date().toISOString();
  const { error } = await supabase.from("reviews").update(patch).eq("id", id);
  updateTag("reviews");
  back("/admin/reviews", error ? (visible ? "einwilligung" : "fehler") : "gespeichert");
}

export async function deleteReview(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = String(formData.get("id"));
  if (!uuid.safeParse(id).success) back("/admin/reviews", "ungueltig");
  const { error } = await supabase.from("reviews").delete().eq("id", id);
  updateTag("reviews");
  back("/admin/reviews", error ? "fehler" : "geloescht");
}
