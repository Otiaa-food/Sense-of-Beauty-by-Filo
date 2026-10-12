import "server-only";
import { dateToLocal, dayRange } from "@/lib/admin/time";
import { brand } from "@/lib/brand.config";
import { buildIcs } from "@/lib/notify/ics";
import { emailConfigured, sendEmail, sendSms, smsConfigured, type SendResult } from "@/lib/notify/send";
import { siteUrl } from "@/lib/notify/site";
import * as t from "@/lib/notify/templates";
import { expireWaitlist, sendBirthdayGreetings } from "@/lib/notify/outreach";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Wann wird was verschickt? (Alles mit dem Secret Key auf dem Server, nie im Browser.)
 * Jede Nachricht wird vorher in `notifications` eingetragen. Gibt es den Eintrag schon,
 * wird nichts doppelt verschickt, auch wenn eine Aktion zweimal läuft.
 * Fehler beim Versand brechen nie eine Buchung ab, sie werden nur protokolliert.
 */

type Kind =
  | "confirmation"
  | "cancellation"
  | "reschedule"
  | "reminder"
  | "review_request"
  | "rebook"
  | "owner_new_booking"
  | "owner_cancellation";
type Channel = "email" | "sms";

export { siteUrl };

type Loaded = {
  id: string;
  start: Date;
  end: Date;
  price: number;
  status: string;
  source: string;
  token: string;
  notes: string;
  serviceName: string;
  rebookAfterDays: number | null;
  customer: {
    id: string;
    firstName: string;
    lastName: string;
    email: string | null;
    phone: string | null;
    marketing: boolean;
    anonymized: boolean;
  };
};

const SELECT =
  "id, start_time, end_time, price, status, source, manage_token, customer_notes, services(name, rebook_after_days), customers(id, first_name, last_name, email, phone, marketing_consent, anonymized_at)";

function toLoaded(row: Record<string, unknown>): Loaded {
  const s = row.services as { name: string; rebook_after_days: number | null } | null;
  const c = row.customers as {
    id: string;
    first_name: string;
    last_name: string;
    email: string | null;
    phone: string | null;
    marketing_consent: boolean;
    anonymized_at: string | null;
  };
  return {
    id: row.id as string,
    start: new Date(row.start_time as string),
    end: new Date(row.end_time as string),
    price: Number(row.price),
    status: row.status as string,
    source: row.source as string,
    token: row.manage_token as string,
    notes: (row.customer_notes as string | null) ?? "",
    serviceName: s?.name ?? "Behandlung",
    rebookAfterDays: s?.rebook_after_days ?? null,
    customer: {
      id: c.id,
      firstName: c.first_name,
      lastName: c.last_name,
      email: c.email,
      phone: c.phone,
      marketing: c.marketing_consent,
      anonymized: Boolean(c.anonymized_at),
    },
  };
}

async function load(appointmentId: string): Promise<Loaded | null> {
  const admin = createAdminClient();
  const { data, error } = await admin.from("appointments").select(SELECT).eq("id", appointmentId).maybeSingle();
  if (error) throw error;
  return data ? toLoaded(data) : null;
}

function info(a: Loaded): t.AppointmentInfo {
  return {
    firstName: a.customer.firstName,
    serviceName: a.serviceName,
    start: a.start,
    end: a.end,
    price: a.price,
    manageUrl: `${siteUrl()}/termin/${a.token}`,
  };
}

/** Eintragen, versenden, Ergebnis speichern. Gibt false zurück, wenn schon verschickt. */
async function deliver(
  appointmentId: string,
  type: Kind,
  channel: Channel,
  scheduledAt: Date,
  send: () => Promise<SendResult>,
): Promise<boolean> {
  const admin = createAdminClient();
  const { data: row, error } = await admin
    .from("notifications")
    .upsert(
      { appointment_id: appointmentId, type, channel, scheduled_at: scheduledAt.toISOString() },
      { onConflict: "appointment_id,type,channel,scheduled_at", ignoreDuplicates: true },
    )
    .select("id")
    .maybeSingle();
  if (error) {
    console.error("Benachrichtigung konnte nicht eingetragen werden:", error);
    return false;
  }
  if (!row) return false; // gab es schon

  let result: SendResult;
  try {
    result = await send();
  } catch (e) {
    result = { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
  await admin
    .from("notifications")
    .update(
      result.ok
        ? { status: "sent", sent_at: new Date().toISOString() }
        : { status: result.skipped ? "skipped" : "failed", error_message: result.error.slice(0, 500) },
    )
    .eq("id", row.id);
  if (!result.ok && !result.skipped) console.error(`Versand ${type}/${channel} fehlgeschlagen:`, result.error);
  return result.ok;
}

const ownerEmail = () => process.env.NOTIFY_EMAIL ?? "";

// ---------- Ereignisse ----------

/** Neue Buchung: Bestätigung an die Kundin (mit Kalendereintrag), Hinweis an Filo bei Online-Buchung */
export async function notifyBooked(appointmentId: string) {
  const a = await load(appointmentId);
  if (!a || a.status === "cancelled") return;
  const i = info(a);

  if (a.customer.email) {
    const msg = t.confirmationEmail(i);
    const ics = buildIcs({
      uid: `${a.id}@${new URL(siteUrl()).host}`,
      start: a.start,
      end: a.end,
      title: `${a.serviceName} bei ${brand.fullName}`,
      location: `${brand.fullName}, ${brand.address.street}, ${brand.address.detail}, ${brand.address.zip} ${brand.address.city}`,
      description: `Termin ansehen oder absagen: ${i.manageUrl}`,
      organizer: brand.fullName,
    });
    await deliver(a.id, "confirmation", "email", a.start, () =>
      sendEmail({ to: a.customer.email!, ...msg, attachments: [{ filename: "termin.ics", content: ics, contentType: "text/calendar" }] }),
    );
  }

  if (a.source === "online" && ownerEmail()) {
    const msg = t.ownerNewBookingEmail(
      {
        ...i,
        customerName: `${a.customer.firstName} ${a.customer.lastName}`,
        phone: a.customer.phone ?? "",
        email: a.customer.email ?? "",
        notes: a.notes,
      },
      `${siteUrl()}/admin/appointments/${a.id}`,
    );
    await deliver(a.id, "owner_new_booking", "email", a.start, () =>
      sendEmail({ to: ownerEmail(), ...msg, replyTo: a.customer.email ?? undefined }),
    );
  }
}

/** Absage: Info an die Kundin; sagt die Kundin selbst ab, bekommt auch Filo Bescheid */
export async function notifyCancelled(appointmentId: string, opts: { byCustomer: boolean }) {
  const a = await load(appointmentId);
  if (!a) return;
  const i = info(a);
  if (a.customer.email) {
    const msg = t.cancellationEmail(i, `${siteUrl()}/book`);
    await deliver(a.id, "cancellation", "email", a.start, () => sendEmail({ to: a.customer.email!, ...msg }));
  }
  if (opts.byCustomer && ownerEmail()) {
    const msg = t.ownerCancellationEmail(
      { ...i, customerName: `${a.customer.firstName} ${a.customer.lastName}` },
      `${siteUrl()}/admin/appointments/${a.id}`,
    );
    await deliver(a.id, "owner_cancellation", "email", a.start, () => sendEmail({ to: ownerEmail(), ...msg }));
  }
}

/** Verschoben: neue Zeit an die Kundin (je neuer Zeit eine Nachricht) */
export async function notifyRescheduled(appointmentId: string) {
  const a = await load(appointmentId);
  if (!a || !a.customer.email || a.status === "cancelled") return;
  const msg = t.rescheduleEmail(info(a));
  await deliver(a.id, "reschedule", "email", a.start, () => sendEmail({ to: a.customer.email!, ...msg }));
}

// ---------- Täglicher Lauf (Vercel Cron) ----------

const DAY = 24 * 3600_000;

/** Ortstag (Europe/Berlin) als Zeitraum, offset = Tage ab heute */
function localDay(now: Date, offset: number) {
  const key = dateToLocal(new Date(now.getTime() + offset * DAY), brand.timezone).date;
  return dayRange(key, brand.timezone)!;
}

export async function runDailyJobs(now = new Date()) {
  const admin = createAdminClient();
  const summary = { reminders: 0, sms: 0, reviews: 0, rebooks: 0, birthdays: 0, waitlistExpired: 0 };

  // 1. Erinnerung für morgen (E-Mail und SMS)
  const tomorrow = localDay(now, 1);
  const { data: upcoming } = await admin
    .from("appointments")
    .select(SELECT)
    .eq("status", "confirmed")
    .gte("start_time", tomorrow.from.toISOString())
    .lt("start_time", tomorrow.to.toISOString());
  const { data: smsSetting } = await admin.from("settings").select("value").eq("key", "sms_reminders_enabled").maybeSingle();
  const smsOn = smsConfigured() && smsSetting?.value !== false;

  for (const row of upcoming ?? []) {
    const a = toLoaded(row);
    if (a.customer.anonymized) continue;
    const i = info(a);
    if (a.customer.email && emailConfigured()) {
      if (await deliver(a.id, "reminder", "email", a.start, () => sendEmail({ to: a.customer.email!, ...t.reminderEmail(i) }))) summary.reminders++;
    }
    if (a.customer.phone && smsOn) {
      if (await deliver(a.id, "reminder", "sms", a.start, () => sendSms({ to: a.customer.phone!, text: t.reminderSms(i) }))) summary.sms++;
    }
  }

  // 2. Bewertungsanfrage: Termine der letzten 3 Tage mit Status „Erschienen", je Kundin nur einmal
  const { data: reviewSetting } = await admin.from("settings").select("value").eq("key", "google_review_url").maybeSingle();
  const reviewUrl = (reviewSetting?.value as string | undefined) || brand.contact.googleBusinessUrl;
  const { data: done } = await admin
    .from("appointments")
    .select(SELECT)
    .eq("status", "completed")
    .gte("start_time", new Date(now.getTime() - 3 * DAY).toISOString())
    .lt("start_time", now.toISOString());
  const askedToday = new Set<string>();
  for (const row of done ?? []) {
    const a = toLoaded(row);
    if (!a.customer.email || a.customer.anonymized || !reviewUrl || !emailConfigured()) continue;
    if (askedToday.has(a.customer.id)) continue;
    askedToday.add(a.customer.id);
    const { data: earlier } = await admin
      .from("notifications")
      .select("id, appointments!inner(customer_id)")
      .eq("type", "review_request")
      .eq("status", "sent")
      .eq("appointments.customer_id", a.customer.id)
      .limit(1);
    if (earlier && earlier.length > 0) continue;
    const msg = t.reviewRequestEmail(a.customer.firstName, reviewUrl);
    if (await deliver(a.id, "review_request", "email", a.start, () => sendEmail({ to: a.customer.email!, ...msg }))) summary.reviews++;
  }

  // 3. Nachbuchungs-Erinnerung: nur mit Werbe-Einwilligung und wenn noch kein neuer Termin besteht
  const { data: past } = await admin
    .from("appointments")
    .select(SELECT)
    .eq("status", "completed")
    .gte("start_time", new Date(now.getTime() - 400 * DAY).toISOString())
    .lt("start_time", now.toISOString());
  for (const row of past ?? []) {
    const a = toLoaded(row);
    if (!a.rebookAfterDays || !a.customer.email || !a.customer.marketing || a.customer.anonymized || !emailConfigured()) continue;
    const due = a.start.getTime() + a.rebookAfterDays * DAY;
    if (due > now.getTime() || due < now.getTime() - 3 * DAY) continue;
    const { data: later } = await admin
      .from("appointments")
      .select("id")
      .eq("customer_id", a.customer.id)
      .in("status", ["pending", "confirmed", "completed"])
      .gt("start_time", a.start.toISOString())
      .limit(1);
    if (later && later.length > 0) continue;
    const msg = t.rebookEmail(a.customer.firstName, a.serviceName, `${siteUrl()}/book`, `${siteUrl()}/abmelden/${a.token}`);
    if (await deliver(a.id, "rebook", "email", a.start, () => sendEmail({ to: a.customer.email!, ...msg }))) summary.rebooks++;
  }

  // 4. Geburtstagsgrüße (nur wenn im Admin eingeschaltet, nur mit Werbe-Einwilligung)
  try {
    summary.birthdays = await sendBirthdayGreetings(now);
  } catch (e) {
    console.error("Geburtstagsgrüße fehlgeschlagen:", e);
  }

  // 5. Warteliste: vergangene Wunschtage beenden
  summary.waitlistExpired = await expireWaitlist(dateToLocal(now, brand.timezone).date);

  return summary;
}
