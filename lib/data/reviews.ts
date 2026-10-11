import { createClient } from "@supabase/supabase-js";
import { cacheLife, cacheTag } from "next/cache";
import { getPublicEnv } from "@/lib/env";
import { emptySummary, parseSummary, type Review, type ReviewSummary } from "@/lib/reviews";

/**
 * Bewertungen für die Website: nur freigegebene Zitate (Row Level Security) und die Übersicht.
 * Zwischengespeichert, erneuert sich sofort, wenn Filo im Admin etwas ändert (Tag "reviews").
 */
export async function getReviews(): Promise<{ reviews: Review[]; summary: ReviewSummary }> {
  "use cache";
  cacheTag("reviews");
  try {
    const env = getPublicEnv();
    const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const [r, s] = await Promise.all([
      supabase
        .from("reviews")
        .select("id, author_name, rating, text, source, source_url, review_date")
        .order("review_date", { ascending: false, nullsFirst: false })
        .limit(24),
      supabase.from("settings").select("value").eq("key", "review_summary").maybeSingle(),
    ]);
    if (r.error) throw r.error;
    cacheLife("hours");
    return { reviews: (r.data ?? []) as Review[], summary: parseSummary(s.data?.value) };
  } catch (error) {
    console.error("Bewertungen konnten nicht geladen werden:", error);
    cacheLife({ stale: 30, revalidate: 60, expire: 900 });
    return { reviews: [], summary: emptySummary };
  }
}
