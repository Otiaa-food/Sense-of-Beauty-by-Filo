import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getPublicEnv } from "@/lib/env";

/**
 * Supabase auf dem Server, im Namen der eingeloggten Person.
 * Row Level Security gilt weiterhin. Liest Cookies, daher nur hinter <Suspense> verwenden.
 */
export async function createClient() {
  const env = getPublicEnv();
  const cookieStore = await cookies();

  return createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // In Server Components darf nicht geschrieben werden. Das ist ok,
            // solange die Sitzung an anderer Stelle (Proxy/Route) erneuert wird.
          }
        },
      },
    },
  );
}
