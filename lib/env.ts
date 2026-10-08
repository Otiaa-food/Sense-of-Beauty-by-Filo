import { z } from "zod";

/**
 * Prüft Umgebungsvariablen erst, wenn sie gebraucht werden.
 * So lässt sich das Projekt auch ohne Schlüssel bauen und testen,
 * und Fehler nennen klar, was in .env.local fehlt.
 */

const publicSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
});

const serverSchema = publicSchema.extend({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
});

function describe(error: z.ZodError): string {
  return error.issues.map((i) => i.path.join(".")).join(", ");
}

/** Für Browser und Server. Darf NUR öffentliche Werte enthalten. */
export function getPublicEnv() {
  // Next ersetzt NEXT_PUBLIC_* nur bei direktem Zugriff, deshalb einzeln lesen.
  const parsed = publicSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });
  if (!parsed.success) {
    throw new Error(
      `Fehlende oder ungültige Umgebungsvariablen: ${describe(parsed.error)}. Siehe .env.example.`,
    );
  }
  return parsed.data;
}

/** Nur auf dem Server verwenden (enthält den geheimen Service-Role-Key). */
export function getServerEnv() {
  const parsed = serverSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  });
  if (!parsed.success) {
    throw new Error(
      `Fehlende oder ungültige Umgebungsvariablen: ${describe(parsed.error)}. Siehe .env.example.`,
    );
  }
  return parsed.data;
}
