import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AdminTitle, btnSolid, Flash, Loading } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin/auth";
import { fmtDate, fmtTime } from "@/lib/admin/format";
import { siteUrl } from "@/lib/notify/site";
import { campaignEmail, campaignSms } from "@/lib/notify/templates";
import { deleteCampaign, sendCampaignNow } from "../../actions";

export const metadata: Metadata = { title: "Rundnachricht" };

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ meldung?: string }> };

export default function CampaignPage(props: Props) {
  return (
    <Suspense fallback={<Loading />}>
      <Content {...props} />
    </Suspense>
  );
}

async function Content({ params, searchParams }: Props) {
  const { supabase } = await requireAdmin();
  const { id } = await params;
  const { meldung } = await searchParams;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();

  const { data: c } = await supabase
    .from("campaigns")
    .select("id, channel, subject, body, recipients, sent_count, sent_at")
    .eq("id", id)
    .maybeSingle();
  if (!c) notFound();

  const channel = c.channel as "email" | "sms";
  const [{ count: reachable }, { data: log }] = await Promise.all([
    supabase
      .from("customers")
      .select("id", { count: "exact", head: true })
      .eq("marketing_consent", true)
      .is("anonymized_at", null)
      .not(channel === "email" ? "email" : "phone", "is", null),
    supabase.from("message_log").select("status").eq("campaign_id", id),
  ]);
  const failed = (log ?? []).filter((l) => l.status === "failed").length;
  const sent = (log ?? []).filter((l) => l.status === "sent").length;

  const sample = { firstName: "Maria", unsubscribeUrl: `${siteUrl()}/abmelden/…` };
  const email = channel === "email" ? campaignEmail({ subject: c.subject ?? "", body: c.body, bookUrl: `${siteUrl()}/book`, ...sample }) : null;
  const sms = channel === "sms" ? campaignSms({ body: c.body, ...sample }) : null;

  return (
    <div className="max-w-3xl">
      <Flash code={meldung} />
      <p className="mb-2 text-sm">
        <Link href="/admin/kampagnen" className="text-muted underline underline-offset-4 hover:text-espresso">Zurück zu Kampagnen</Link>
      </p>
      <AdminTitle>{channel === "email" ? "Rundnachricht per E-Mail" : "Rundnachricht per SMS"}</AdminTitle>

      <section>
        <h2 className="label text-muted">Vorschau (Beispiel: Maria)</h2>
        {email ? (
          <div className="mt-3 border border-line bg-white">
            <p className="border-b border-line px-4 py-3 text-sm text-espresso">Betreff: {email.subject}</p>
            <iframe title="Vorschau der E-Mail" srcDoc={email.html} sandbox="" className="h-[32rem] w-full" />
          </div>
        ) : null}
        {sms ? (
          <div className="mt-3 max-w-sm border border-line bg-white p-4 text-[0.95rem] leading-relaxed text-espresso">
            {sms}
            <p className="mt-3 text-xs text-muted">{sms.length} Zeichen{sms.length > 160 ? `, wird als ${Math.ceil(sms.length / 153)} SMS berechnet` : ""}</p>
          </div>
        ) : null}
      </section>

      {c.sent_at ? (
        <section className="mt-10 border border-line bg-white p-5">
          <p className="text-espresso">
            Verschickt am {fmtDate(c.sent_at)}, {fmtTime(c.sent_at)} Uhr: {sent} von {c.recipients || reachable || 0} angekommen
            {failed ? `, ${failed} fehlgeschlagen` : ""}.
          </p>
          <p className="mt-2 text-sm text-muted">Läuft der Versand noch, Seite in einer Minute neu laden.</p>
        </section>
      ) : (
        <section className="mt-10 space-y-5 border border-line bg-white p-5">
          <p className="text-espresso">
            Geht an <strong className="font-medium">{reachable ?? 0} Kundinnen</strong> mit Einwilligung
            {channel === "sms" ? " (SMS kosten je Stück, siehe seven.io)." : "."}
          </p>
          <form action={sendCampaignNow} className="space-y-4">
            <input type="hidden" name="id" value={c.id} />
            <label className="flex items-start gap-3 text-sm text-muted">
              <input type="checkbox" name="confirm" required className="mt-0.5 h-5 w-5 shrink-0 accent-espresso" />
              <span>Text geprüft, jetzt an alle verschicken. Das lässt sich nicht rückgängig machen.</span>
            </label>
            <button type="submit" className={btnSolid} disabled={!reachable}>Jetzt verschicken</button>
          </form>
          <form action={deleteCampaign}>
            <input type="hidden" name="id" value={c.id} />
            <button type="submit" className="text-sm text-muted underline underline-offset-4 hover:text-espresso">Entwurf löschen</button>
          </form>
        </section>
      )}
    </div>
  );
}
