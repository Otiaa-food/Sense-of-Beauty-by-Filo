"use server";

import { redirect } from "next/navigation";
import { cancelByToken, TOKEN_PATTERN } from "@/lib/booking/manage";

export async function cancelAppointment(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  if (!TOKEN_PATTERN.test(token)) redirect("/");
  const result = await cancelByToken(token);
  redirect(`/termin/${token}?storno=${result}`);
}
