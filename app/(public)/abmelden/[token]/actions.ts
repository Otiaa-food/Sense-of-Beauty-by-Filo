"use server";

import { redirect } from "next/navigation";
import { TOKEN_PATTERN } from "@/lib/booking/manage";
import { createAdminClient } from "@/lib/supabase/admin";

/** Werbe-E-Mails und -SMS abbestellen (Einwilligung zurücknehmen). Termin-E-Mails kommen weiterhin. */
export async function unsubscribe(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  if (!TOKEN_PATTERN.test(token)) redirect("/");
  const admin = createAdminClient();
  // Link aus Termin-E-Mails (Termin-Schlüssel) oder aus Geburtstags-/Rundnachrichten (Kundinnen-Schlüssel)
  const { data: appt } = await admin.from("appointments").select("customer_id").eq("manage_token", token).maybeSingle();
  const off = { marketing_consent: false, marketing_consent_at: null };
  if (appt) await admin.from("customers").update(off).eq("id", appt.customer_id);
  else await admin.from("customers").update(off).eq("unsubscribe_token", token);
  redirect(`/abmelden/${token}?erledigt=1`);
}
