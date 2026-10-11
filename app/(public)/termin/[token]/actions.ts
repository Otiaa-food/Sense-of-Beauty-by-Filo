"use server";

import { redirect } from "next/navigation";
import { after } from "next/server";
import { notifyCancelled } from "@/lib/notify/dispatch";
import { cancelByToken, TOKEN_PATTERN } from "@/lib/booking/manage";

export async function cancelAppointment(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  if (!TOKEN_PATTERN.test(token)) redirect("/");
  const { result, id } = await cancelByToken(token);
  if (result === "cancelled" && id) {
    after(() => notifyCancelled(id, { byCustomer: true }).catch((e) => console.error("Absage-Mail fehlgeschlagen:", e)));
  }
  redirect(`/termin/${token}?storno=${result}`);
}
