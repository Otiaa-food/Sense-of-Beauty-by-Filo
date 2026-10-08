import { createClient } from "@supabase/supabase-js";
import { cacheLife, cacheTag } from "next/cache";
import { getPublicEnv } from "@/lib/env";
import type { CatalogCategory, CatalogService } from "@/lib/catalog";

export type CatalogResult =
  | { ok: true; categories: CatalogCategory[]; services: CatalogService[] }
  | { ok: false; categories: []; services: [] };

/**
 * Liest Behandlungen für die öffentliche Website.
 * Nutzt nur den öffentlichen Schlüssel: Row Level Security erlaubt Besuchern ohnehin nur aktive Einträge.
 * Das Ergebnis wird zwischengespeichert (schnelle Seite, weniger Datenbank-Abfragen).
 * Mit revalidateTag("catalog") lässt sich der Zwischenspeicher aus dem Admin später sofort erneuern.
 */
export async function getCatalog(): Promise<CatalogResult> {
  "use cache";
  cacheTag("catalog");

  try {
    const env = getPublicEnv();
    const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const [cats, svcs] = await Promise.all([
      supabase.from("service_categories").select("id, slug, name, description, sort_order").order("sort_order"),
      supabase
        .from("services")
        .select("id, category_id, name, slug, description, duration_minutes, price, online_booking_enabled, addon_only, sort_order")
        .order("sort_order"),
    ]);
    if (cats.error) throw cats.error;
    if (svcs.error) throw svcs.error;

    cacheLife("hours");
    return {
      ok: true,
      categories: cats.data as CatalogCategory[],
      // numeric kommt aus der Datenbank teils als Text zurück
      services: (svcs.data as (Omit<CatalogService, "price"> & { price: number | string })[]).map((s) => ({
        ...s,
        price: Number(s.price),
      })),
    };
  } catch (error) {
    console.error("Behandlungen konnten nicht geladen werden:", error);
    // Fehler nur kurz merken, damit sich die Seite bald von selbst erholt.
    // (Eigenes Profil: "seconds" würde die Seite vom Vorab-Erzeugen ausschließen und den Build abbrechen.)
    cacheLife({ stale: 30, revalidate: 60, expire: 900 });
    return { ok: false, categories: [], services: [] };
  }
}
