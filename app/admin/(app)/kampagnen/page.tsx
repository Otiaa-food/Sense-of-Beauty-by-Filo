import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AdminTitle, btnSolid, Flash, inputClass, Loading } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin/auth";
import { fmtDate } from "@/lib/admin/format";
import { parseBirthdayCampaign } from "@/lib/campaigns";
import { emailConfigured, smsConfigured } from "@/lib/notify/send";
import { createCampaign, saveBirthdayCampaign } from "../actions";

export const metadata: Metadata = { title: "Kampagnen" };

type Props = { searchParams: Promise<{ meldung?: string }> };

export default function CampaignsPage(props: Props) {
  return (
    <>
      <AdminTitle>Kampagnen</AdminTitle>
      <Suspense fallback={<Loading />}>
        <Content {...props} />
      </Suspense>
    </>
  );
}

async function Content({ searchParams }: Props) {
  const { supabase } = await requireAdmin();
  const { meldung } = await searchParams;
  const consent = () => supabase.from("customers").select("id", { count: "exact", head: true }).eq("marketing_consent", true).is("anonymized_at", null);
  const [{ data: setting }, { count: withBirthday }, { count: emailCount }, { count: smsCount }, { data: campaigns }] = await Promise.all([
    supabase.from("settings").select("value").eq("key", "birthday_campaign").maybeSingle(),
    consent().not("birthday_month", "is", null),
    consent().not("email", "is", null),
    consent().not("phone", "is", null),
    supabase.from("campaigns").select("id, channel, subject, body, recipients, sent_count, sent_at, created_at").order("created_at", { ascending: false }).limit(20),
  ]);
  const b = parseBirthdayCampaign(setting?.value);
  const mailOn = emailConfigured();
  const smsOn = smsConfigured();

  return (
    <div className="max-w-3xl">
      <Flash code={meldung} />
      <p className="text-muted">
        Alle Kampagnen gehen nur an Kundinnen, die beim Buchen „Neuigkeiten, Angebote und Geburtstagsgrüße“ angehakt haben (oder bei denen du
        das mit ihrer Zustimmung eingetragen hast). Jede Nachricht enthält einen Abmelde-Link.
      </p>
      {!mailOn || !smsOn ? (
        <p className="mt-4 border border-line bg-white p-4 text-sm text-muted">
          {!mailOn ? "E-Mail-Versand ist noch nicht eingerichtet. " : ""}
          {!smsOn ? "SMS-Versand ist noch nicht eingerichtet. " : ""}
          Anleitung: docs/nachrichten-einrichten.md
        </p>
      ) : null}

      <section className="mt-10">
        <h2 className="text-2xl font-light text-espresso">Geburtstagsgruß</h2>
        <p className="mt-2 text-muted">
          Läuft automatisch jeden Tag um 17 Uhr. {withBirthday ?? 0} Kundinnen haben einen Geburtstag hinterlegt und Angebote erlaubt.
        </p>
        <form action={saveBirthdayCampaign} className="mt-5 space-y-5 border border-line bg-white p-5">
          <label className="flex items-center gap-3 text-espresso">
            <input type="checkbox" name="enabled" defaultChecked={b.enabled} className="h-5 w-5 accent-espresso" />
            Geburtstagsgrüße automatisch verschicken
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="label text-muted">Geschenk</span>
              <input name="gift" required maxLength={120} defaultValue={b.gift} className={inputClass} />
            </label>
            <label className="block">
              <span className="label text-muted">Gutschein-Code (freiwillig)</span>
              <input name="code" maxLength={30} defaultValue={b.code} placeholder="z. B. BDAY10" className={inputClass} />
            </label>
            <label className="block">
              <span className="label text-muted">Gültig (Tage)</span>
              <input name="validDays" type="number" min={1} max={365} defaultValue={b.validDays} className={inputClass} />
            </label>
            <label className="block">
              <span className="label text-muted">Kanal</span>
              <select name="channel" defaultValue={b.channel} className={inputClass}>
                <option value="email">E-Mail</option>
                <option value="sms">SMS</option>
                <option value="both">E-Mail und SMS</option>
              </select>
            </label>
          </div>
          <div className="border-t border-line pt-4 text-sm text-muted">
            <p className="label !text-[0.6rem]">Vorschau</p>
            <p className="mt-2 leading-relaxed text-espresso">
              „Alles Liebe zum Geburtstag, Maria! Mein Geschenk für dich: {b.gift}, gültig {b.validDays} Tage.
              {b.code ? ` Code: ${b.code}.` : ""} Zeig einfach diese Nachricht im Studio.“
            </p>
          </div>
          <button type="submit" className={btnSolid}>Speichern</button>
        </form>
      </section>

      <section className="mt-14">
        <h2 className="text-2xl font-light text-espresso">Rundnachricht</h2>
        <p className="mt-2 text-muted">
          Zum Beispiel für freie Termine, neue Behandlungen oder ein Angebot. Erreichbar: {emailCount ?? 0} per E-Mail, {smsCount ?? 0} per SMS.
          Du siehst vor dem Versand eine Vorschau.
        </p>
        <form action={createCampaign} className="mt-5 space-y-4 border border-line bg-white p-5">
          <label className="block">
            <span className="label text-muted">Kanal</span>
            <select name="channel" defaultValue="email" className={inputClass}>
              <option value="email">E-Mail</option>
              <option value="sms">SMS (kurz, höchstens 300 Zeichen)</option>
            </select>
          </label>
          <label className="block">
            <span className="label text-muted">Betreff (nur E-Mail)</span>
            <input name="subject" maxLength={120} placeholder="Neu im Studio: …" className={inputClass} />
          </label>
          <label className="block">
            <span className="label text-muted">Text</span>
            <textarea name="body" rows={6} required maxLength={5000} placeholder={"Hey {vorname},\n\n…"} className={`${inputClass} py-2`} />
          </label>
          <p className="text-sm text-muted">{"{vorname}"} wird durch den Vornamen ersetzt. Link zur Buchung und Abmelde-Link werden automatisch angehängt.</p>
          <button type="submit" className={btnSolid}>Weiter zur Vorschau</button>
        </form>

        {campaigns && campaigns.length > 0 ? (
          <ul className="mt-8 divide-y divide-line border-y border-line bg-white">
            {campaigns.map((c) => (
              <li key={c.id}>
                <Link href={`/admin/kampagnen/${c.id}`} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 hover:bg-paper">
                  <span className="min-w-0 flex-1 truncate text-espresso">{c.subject ?? c.body}</span>
                  <span className="text-sm text-muted">
                    {c.channel === "email" ? "E-Mail" : "SMS"},{" "}
                    {c.sent_at ? `${c.sent_count}/${c.recipients} verschickt am ${fmtDate(c.sent_at, { day: "numeric", month: "short" })}` : "Entwurf"}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : null}
      </section>
    </div>
  );
}
