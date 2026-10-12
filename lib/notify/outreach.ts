import "server-only";
import { localDateKey } from "@/lib/booking/availability";
import { availableSlots, type BookableService } from "@/lib/booking/server";
import { brand } from "@/lib/brand.config";
import { siteUrl } from "@/lib/notify/site";
import { birthdayKeys, parseBirthdayCampaign } from "@/lib/campaigns";
import { normalizePhone } from "@/lib/notify/phone";
import { emailConfigured, sendEmail, sendSms, smsConfigured, type SendResult } from "@/lib/notify/send";
import * as t from "@/lib/notify/templates";
import { createAdminClient } from "@/lib/supabase/admin";
import { slotsInWindow } from "@/lib/waitlist";

/**
 * Nachrichten, die nicht zu einem einzelnen Termin gehören: Warteliste, Geburtstag, Rundnachricht.
 * Jede Nachricht bekommt vorher einen eindeutigen Schlüssel in `message_log`.
 * Gibt es den Schlüssel schon, wird nicht nochmal verschickt (kein Doppelversand, auch nicht bei Wiederholung).
 */

type LogRefs = { customer_id?: string | null; waitlist_id?: string | null; campaign_id?: string | null };
type LogType = "waitlist_offer" | "birthday" | "campaign";
type Channel = "email" | "sms";

async function deliverLogged(key: string, type: LogType, channel: Channel, refs: LogRefs, send: () => Promise<SendResult>) {
  const admin = createAdminClient();
  const { data: row, error } = await admin
    .from("message_log")
    .upsert({ dedupe_key: key, type, channel, ...refs }, { onConflict: "dedupe_key", ignoreDuplicates: true })
    .select("id")
    .maybeSingle();
  if (error) {
    console.error("Nachricht konnte nicht eingetragen werden:", error);
    return false;
  }
  if (!row) return false; // schon verschickt

  let result: SendResult;
  try {
    result = await send();
  } catch (e) {
    result = { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
  await admin
    .from("message_log")
    .update(
      result.ok
        ? { status: "sent", sent_at: new Date().toISOString() }
        : { status: result.skipped ? "skipped" : "failed", error_message: result.error.slice(0, 500) },
    )
    .eq("id", row.id);
  if (!result.ok && !result.skipped) console.error(`Versand ${type}/${channel} fehlgeschlagen:`, result.error);
  return result.ok;
}

// ---------- Warteliste ----------

type WaitlistRow = {
  id: string;
  desired_date: string;
  time_from: string;
  time_to: string;
  first_name: string;
  email: string | null;
  phone: string | null;
  services: (BookableService & { active: boolean; online_booking_enabled: boolean; addon_only: boolean }) | null;
};

/**
 * Prüft die Warteliste für einen Tag: Wer passt zu einer jetzt freien Zeit, bekommt Bescheid.
 * `reason` macht den Schlüssel eindeutig (z. B. die ID des abgesagten Termins),
 * so bekommt eine Kundin bei jeder neuen Absage höchstens eine Nachricht je Kanal.
 */
export async function offerFreedTimes(day: string, reason: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("waitlist")
    .select(
      "id, desired_date, time_from, time_to, first_name, email, phone, services(id, slug, name, duration_minutes, buffer_minutes, price, active, online_booking_enabled, addon_only)",
    )
    .eq("desired_date", day)
    .in("status", ["waiting", "notified"])
    .order("created_at");
  if (error) throw error;

  const slotCache = new Map<string, Date[]>();
  let notified = 0;
  for (const entry of (data ?? []) as unknown as WaitlistRow[]) {
    const s = entry.services;
    if (!s || !s.active || !s.online_booking_enabled || s.addon_only) continue;
    if (!slotCache.has(s.id)) slotCache.set(s.id, (await availableSlots({ ...s, price: Number(s.price) }, day)).slots);
    const fitting = slotsInWindow(slotCache.get(s.id)!, entry.time_from, entry.time_to, brand.timezone);
    if (fitting.length === 0) continue;

    const offer: t.WaitlistOffer = {
      firstName: entry.first_name,
      serviceName: s.name,
      start: fitting[0],
      bookUrl: `${siteUrl()}/book?service=${s.slug}&tag=${day}`,
    };
    const refs = { waitlist_id: entry.id };
    let sent = false;
    if (entry.phone && smsConfigured()) {
      sent =
        (await deliverLogged(`waitlist:${entry.id}:${reason}:sms`, "waitlist_offer", "sms", refs, () =>
          sendSms({ to: entry.phone!, text: t.waitlistOfferSms(offer) }),
        )) || sent;
    }
    if (entry.email && emailConfigured()) {
      sent =
        (await deliverLogged(`waitlist:${entry.id}:${reason}:email`, "waitlist_offer", "email", refs, () =>
          sendEmail({ to: entry.email!, ...t.waitlistOfferEmail(offer) }),
        )) || sent;
    }
    if (sent) {
      notified++;
      await admin.from("waitlist").update({ status: "notified", notified_at: new Date().toISOString() }).eq("id", entry.id);
    }
  }
  return notified;
}

/** Nach einer Absage: Warteliste für den Tag des abgesagten Termins prüfen */
export async function offerCancelledAppointment(appointmentId: string) {
  const admin = createAdminClient();
  const { data } = await admin.from("appointments").select("start_time, status").eq("id", appointmentId).maybeSingle();
  if (!data || data.status !== "cancelled") return 0;
  const start = new Date(data.start_time);
  if (start.getTime() < Date.now()) return 0;
  return offerFreedTimes(localDateKey(start, brand.timezone), appointmentId);
}

/** Bucht eine Kundin selbst, ist ihr Wartelisten-Eintrag für diesen Tag erledigt */
export async function markWaitlistBooked(serviceId: string, day: string, email: string, phone: string) {
  const admin = createAdminClient();
  const normalized = normalizePhone(phone);
  const base = () =>
    admin.from("waitlist").update({ status: "booked" }).eq("service_id", serviceId).eq("desired_date", day).in("status", ["waiting", "notified"]);
  await base().eq("email", email.toLowerCase());
  if (normalized) await base().eq("phone", normalized);
}

/** Vergangene Wunschtage aufräumen (täglich) */
export async function expireWaitlist(today: string) {
  const admin = createAdminClient();
  const { data } = await admin
    .from("waitlist")
    .update({ status: "expired" })
    .lt("desired_date", today)
    .in("status", ["waiting", "notified"])
    .select("id");
  return data?.length ?? 0;
}

// ---------- Geburtstag ----------

export async function loadBirthdayCampaign() {
  const admin = createAdminClient();
  const { data } = await admin.from("settings").select("value").eq("key", "birthday_campaign").maybeSingle();
  return parseBirthdayCampaign(data?.value);
}

type Recipient = { id: string; first_name: string; email: string | null; phone: string | null; unsubscribe_token: string };

export async function sendBirthdayGreetings(now = new Date()) {
  const campaign = await loadBirthdayCampaign();
  if (!campaign.enabled) return 0;
  const { days, month, year } = birthdayKeys(now);
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("customers")
    .select("id, first_name, email, phone, unsubscribe_token")
    .eq("marketing_consent", true)
    .is("anonymized_at", null)
    .eq("birthday_month", month)
    .in("birthday_day", days);
  if (error) throw error;

  let sent = 0;
  for (const c of (data ?? []) as Recipient[]) {
    const greeting: t.BirthdayGreeting = {
      firstName: c.first_name,
      gift: campaign.gift,
      code: campaign.code,
      validUntil: new Date(now.getTime() + campaign.validDays * 24 * 3600_000),
      bookUrl: `${siteUrl()}/book`,
      unsubscribeUrl: `${siteUrl()}/abmelden/${c.unsubscribe_token}`,
    };
    const refs = { customer_id: c.id };
    const wantEmail = campaign.channel !== "sms";
    const wantSms = campaign.channel !== "email";
    if (wantEmail && c.email && emailConfigured()) {
      if (await deliverLogged(`birthday:${c.id}:${year}:email`, "birthday", "email", refs, () => sendEmail({ to: c.email!, ...t.birthdayEmail(greeting) })))
        sent++;
    }
    if (wantSms && c.phone && smsConfigured()) {
      if (await deliverLogged(`birthday:${c.id}:${year}:sms`, "birthday", "sms", refs, () => sendSms({ to: c.phone!, text: t.birthdaySms(greeting) })))
        sent++;
    }
  }
  return sent;
}

// ---------- Rundnachricht ----------

/** Empfängerinnen einer Rundnachricht: nur mit Werbe-Einwilligung und passendem Kontakt */
export async function campaignRecipients(channel: Channel): Promise<Recipient[]> {
  const admin = createAdminClient();
  const query = admin
    .from("customers")
    .select("id, first_name, email, phone, unsubscribe_token")
    .eq("marketing_consent", true)
    .is("anonymized_at", null);
  const { data, error } = await query.not(channel === "email" ? "email" : "phone", "is", null);
  if (error) throw error;
  return (data ?? []) as Recipient[];
}

export async function sendCampaign(campaignId: string) {
  const admin = createAdminClient();
  const { data: c, error } = await admin.from("campaigns").select("id, channel, subject, body, sent_at").eq("id", campaignId).maybeSingle();
  if (error) throw error;
  if (!c) return { recipients: 0, sent: 0 };
  const channel = c.channel as Channel;
  if (channel === "email" ? !emailConfigured() : !smsConfigured()) return { recipients: 0, sent: 0, notConfigured: true };

  const recipients = await campaignRecipients(channel);
  await admin.from("campaigns").update({ recipients: recipients.length, sent_at: new Date().toISOString() }).eq("id", c.id);

  let sent = 0;
  for (const r of recipients) {
    const unsubscribeUrl = `${siteUrl()}/abmelden/${r.unsubscribe_token}`;
    const refs = { customer_id: r.id, campaign_id: c.id };
    const ok =
      channel === "email"
        ? await deliverLogged(`campaign:${c.id}:${r.id}:email`, "campaign", "email", refs, () =>
            sendEmail({
              to: r.email!,
              ...t.campaignEmail({ subject: c.subject ?? brand.fullName, body: c.body, firstName: r.first_name, bookUrl: `${siteUrl()}/book`, unsubscribeUrl }),
            }),
          )
        : await deliverLogged(`campaign:${c.id}:${r.id}:sms`, "campaign", "sms", refs, () =>
            sendSms({ to: r.phone!, text: t.campaignSms({ body: c.body, firstName: r.first_name, unsubscribeUrl }) }),
          );
    if (ok) sent++;
    // Resend erlaubt nur wenige E-Mails pro Sekunde: kurz warten
    if (channel === "email") await new Promise((r) => setTimeout(r, 550));
  }
  await admin.from("campaigns").update({ sent_count: sent }).eq("id", c.id);
  return { recipients: recipients.length, sent };
}
