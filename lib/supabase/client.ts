import { createBrowserClient } from "@supabase/ssr";
import { getPublicEnv } from "@/lib/env";

/** Supabase im Browser. Nutzt nur den öffentlichen Schlüssel, Zugriff regelt Row Level Security. */
export function createClient() {
  const env = getPublicEnv();
  return createBrowserClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
}
