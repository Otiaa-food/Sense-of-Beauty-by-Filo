import "server-only";
import { brand } from "@/lib/brand.config";
import { createAdminClient } from "@/lib/supabase/admin";

/** Termin über den geheimen Link der Kundin verwalten (ansehen, absagen). */

export const TOKEN_PATTERN = /^[a-f0-9]{64}$/;

export type ManagedAppointment = {
  id: string;
  start_time: string;
  end_time: string;
  status: string;
  price: number;
  serviceName: string;
  firstName: string;
};

export async function loadByToken(token: string): Promise<ManagedAppointment | null> {
  if (!TOKEN_PATTERN.test(token)) return null;
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("appointments")
    .select("id, start_time, end_time, status, price, services(name), customers(first_name)")
    .eq("manage_token", token)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const service = data.services as unknown as { name: string } | null;
  const customer = data.customers as unknown as { first_name: string } | null;
  return {
    id: data.id,
    start_time: data.start_time,
    end_time: data.end_time,
    status: data.status,
    price: Number(data.price),
    serviceName: service?.name ?? "Behandlung",
    firstName: customer?.first_name ?? "",
  };
}

/** Darf noch kostenlos online abgesagt werden? */
export function canCancel(appt: Pick<ManagedAppointment, "start_time" | "status">, now = new Date()) {
  const hours = brand.booking.freeCancellationHours;
  return (
    (appt.status === "confirmed" || appt.status === "pending") &&
    Date.parse(appt.start_time) - now.getTime() >= hours * 3600_000
  );
}

export async function cancelByToken(token: string): Promise<"cancelled" | "too_late" | "not_found"> {
  const appt = await loadByToken(token);
  if (!appt) return "not_found";
  if (!canCancel(appt)) return "too_late";
  const admin = createAdminClient();
  const { error } = await admin
    .from("appointments")
    .update({ status: "cancelled", cancelled_at: new Date().toISOString(), cancel_reason: "Online von der Kundin abgesagt" })
    .eq("id", appt.id)
    .in("status", ["confirmed", "pending"]);
  if (error) throw error;
  return "cancelled";
}
