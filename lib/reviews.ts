/** Bewertungen: Typen und Formatierung (ohne Datenbank, gut testbar). */

export type ReviewSource = "google" | "planity" | "manual";

export type Review = {
  id: string;
  author_name: string;
  rating: number;
  text: string | null;
  source: ReviewSource;
  source_url: string | null;
  review_date: string | null;
};

export type PlatformSummary = { rating: number | null; count: number | null; url?: string };
export type ReviewSummary = { google: PlatformSummary; planity: PlatformSummary };

export const emptySummary: ReviewSummary = {
  google: { rating: null, count: null },
  planity: { rating: null, count: null, url: "" },
};

export const sourceLabel: Record<ReviewSource, string> = {
  google: "Google",
  planity: "Planity",
  manual: "Persönlich",
};

/** 4.9 → "4,9" */
export function formatRating(value: number): string {
  return new Intl.NumberFormat("de-DE", { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(value);
}

/** Übersicht nur zeigen, wenn Schnitt UND Anzahl gepflegt sind (keine halben Angaben) */
export function hasSummary(p: PlatformSummary): p is { rating: number; count: number; url?: string } {
  return typeof p.rating === "number" && p.rating > 0 && p.rating <= 5 && typeof p.count === "number" && p.count > 0;
}

export function parseSummary(value: unknown): ReviewSummary {
  const v = (value ?? {}) as Partial<ReviewSummary>;
  const num = (x: unknown) => (typeof x === "number" && Number.isFinite(x) ? x : null);
  return {
    google: { rating: num(v.google?.rating), count: num(v.google?.count) },
    planity: { rating: num(v.planity?.rating), count: num(v.planity?.count), url: typeof v.planity?.url === "string" ? v.planity.url : "" },
  };
}
