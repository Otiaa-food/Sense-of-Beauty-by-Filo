import "server-only";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Prüft auf dem Server: eingeloggt UND in admin_users eingetragen?
 * Sonst geht es zum Login. Liefert den Supabase-Zugang im Namen der Person:
 * Row Level Security bleibt aktiv, Admins dürfen laut Regeln alles.
 * Jede Admin-Seite und jede Admin-Aktion ruft das zuerst auf.
 */
export async function requireAdmin() {
  // Admin-Seiten werden immer frisch beim Aufruf erzeugt (aktuelle Uhrzeit, aktuelle Termine)
  await connection();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");

  const { data: isAdmin, error } = await supabase.rpc("is_admin");
  if (error || !isAdmin) redirect("/admin/login?fehler=kein-zugang");

  return { supabase, user };
}
