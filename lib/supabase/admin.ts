import "server-only";
import { createClient } from "@supabase/supabase-js";
import { getServerEnv } from "@/lib/env";

/**
 * Supabase mit dem geheimen Service-Role-Key. UMGEHT Row Level Security.
 *
 * Nur für vertrauenswürdige Server-Aufgaben (Buchung anlegen, Webhooks, Erinnerungen).
 * Eingaben vorher immer mit Zod prüfen. Niemals in Client-Komponenten importieren,
 * "server-only" lässt den Build sonst scheitern.
 */
export function createAdminClient() {
  const env = getServerEnv();
  return createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
