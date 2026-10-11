"use server";

import { redirect } from "next/navigation";
import { TOKEN_PATTERN } from "@/lib/booking/manage";
import { createAdminClient } from "@/lib/supabase/admin";

/** Werbe-E-Mails abbestellen (Einwilligung zurücknehmen). Termin-E-Mails kommen weiterhin. */
export async function unsubscribe(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  if (!TOKEN_PATTERN.test(token)) redirect("/");
  const admin = createAdminClient();
  const { data } = await admin.from("appointments").select("customer_id").eq("manage_token", token).maybeSingle();
  if (data) {
    await admin.from("customers").update({ marketing_consent: false, marketing_consent_at: null }).eq("id", data.customer_id);
  }
  redirect(`/abmelden/${token}?erledigt=1`);
}
