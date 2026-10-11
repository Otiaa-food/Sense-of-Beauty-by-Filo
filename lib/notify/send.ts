import "server-only";
import { normalizePhone } from "@/lib/notify/phone";

/**
 * Versand über Resend (E-Mail) und seven.io (SMS, deutscher Anbieter).
 * Fehlt ein Schlüssel, wird nichts verschickt (z. B. lokal oder vor der Einrichtung).
 */

export type SendResult = { ok: true; id?: string } | { ok: false; error: string; skipped?: boolean };

export function emailConfigured() {
  return Boolean(process.env.RESEND_API_KEY && process.env.MAIL_FROM);
}
export function smsConfigured() {
  return Boolean(process.env.SEVEN_API_KEY);
}

export async function sendEmail(input: {
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
  attachments?: { filename: string; content: string; contentType?: string }[];
}): Promise<SendResult> {
  if (!emailConfigured()) return { ok: false, error: "E-Mail nicht eingerichtet", skipped: true };
  const res = await fetch(`${process.env.RESEND_API_URL ?? "https://api.resend.com"}/emails`, {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.MAIL_FROM,
      to: [input.to],
      subject: input.subject,
      html: input.html,
      text: input.text,
      reply_to: input.replyTo ?? process.env.NOTIFY_EMAIL,
      attachments: input.attachments?.map((a) => ({
        filename: a.filename,
        content: Buffer.from(a.content).toString("base64"),
        content_type: a.contentType,
      })),
    }),
  });
  if (!res.ok) return { ok: false, error: `Resend ${res.status}: ${(await res.text()).slice(0, 300)}` };
  const body = (await res.json()) as { id?: string };
  return { ok: true, id: body.id };
}

export async function sendSms(input: { to: string; text: string }): Promise<SendResult> {
  if (!smsConfigured()) return { ok: false, error: "SMS nicht eingerichtet", skipped: true };
  const to = normalizePhone(input.to);
  if (!to) return { ok: false, error: "Ungültige Telefonnummer", skipped: true };
  const res = await fetch(`${process.env.SEVEN_API_URL ?? "https://gateway.seven.io"}/api/sms`, {
    method: "POST",
    headers: { "X-Api-Key": process.env.SEVEN_API_KEY!, "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ to, text: input.text, from: (process.env.SMS_FROM ?? "SenseBeauty").slice(0, 11) }),
  });
  const body = (await res.json().catch(() => ({}))) as { success?: string };
  // seven.io meldet Erfolg mit success "100"
  if (!res.ok || (body.success && body.success !== "100")) {
    return { ok: false, error: `seven.io ${res.status}: ${JSON.stringify(body).slice(0, 300)}` };
  }
  return { ok: true };
}
