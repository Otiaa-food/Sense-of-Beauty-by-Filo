import { brand } from "@/lib/brand.config";
import { formatRating, hasSummary, sourceLabel, type Review, type ReviewSummary } from "@/lib/reviews";

/** Fünf Sterne, teilweise gefüllt. Für Screenreader als Text. */
export function Stars({ value, size = 14 }: { value: number; size?: number }) {
  const pct = Math.max(0, Math.min(100, (value / 5) * 100));
  const row = (fill: string) => (
    <svg width={size * 5 + 8} height={size} viewBox={`0 0 ${5 * 20 + 8} 20`} aria-hidden="true">
      {Array.from({ length: 5 }, (_, i) => (
        <path
          key={i}
          transform={`translate(${i * 22} 0)`}
          d="M10 1.5l2.6 5.5 6 .8-4.4 4.2 1.1 6-5.3-2.9-5.3 2.9 1.1-6L1.4 7.8l6-.8z"
          fill={fill}
        />
      ))}
    </svg>
  );
  return (
    <span className="relative inline-block align-middle" role="img" aria-label={`${formatRating(value)} von 5 Sternen`}>
      <span className="text-line">{row("currentColor")}</span>
      <span className="absolute inset-y-0 left-0 overflow-hidden text-espresso" style={{ width: `${pct}%` }}>
        {row("currentColor")}
      </span>
    </span>
  );
}

/** Übersicht Google / Planity mit Link zur Quelle. Erscheint nur, wenn gepflegt. */
export function ReviewSummaryRow({ summary, googleUrl }: { summary: ReviewSummary; googleUrl: string }) {
  const items = [
    hasSummary(summary.google) ? { name: "Google", ...summary.google, url: googleUrl } : null,
    hasSummary(summary.planity) ? { name: "Planity", ...summary.planity, url: summary.planity.url || "" } : null,
  ].filter(Boolean) as { name: string; rating: number; count: number; url: string }[];
  if (items.length === 0) return null;
  return (
    <ul className="grid gap-1.5 sm:grid-cols-2">
      {items.map((i) => {
        const inner = (
          <>
            <span className="label text-muted">{i.name}</span>
            <span className="mt-3 flex items-center gap-3">
              <span className="text-4xl font-extralight text-espresso">{formatRating(i.rating)}</span>
              <Stars value={i.rating} size={16} />
            </span>
            <span className="mt-2 block text-sm text-muted">{i.count} Bewertungen</span>
          </>
        );
        return (
          <li key={i.name}>
            {i.url ? (
              <a href={i.url} target="_blank" rel="noopener noreferrer" className="block bg-white p-6 transition-colors hover:bg-stone">
                {inner}
              </a>
            ) : (
              <div className="bg-white p-6">{inner}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

const fmtDate = (d: string) =>
  new Intl.DateTimeFormat("de-DE", { month: "long", year: "numeric", timeZone: brand.timezone }).format(new Date(d));

/** Kundenstimmen (nur freigegebene mit Einwilligung) */
export function ReviewQuotes({ reviews }: { reviews: Review[] }) {
  if (reviews.length === 0) return null;
  return (
    <ul className="grid gap-1.5 md:grid-cols-3">
      {reviews.map((r) => (
        <li key={r.id} className="flex flex-col bg-white p-7">
          <Stars value={r.rating} />
          {r.text ? <blockquote className="mt-5 flex-1 text-[0.98rem] leading-[1.8] text-espresso">„{r.text}“</blockquote> : <div className="flex-1" />}
          <p className="mt-6 text-sm text-muted">
            {r.author_name}
            <span className="block text-xs">
              {sourceLabel[r.source]}
              {r.review_date ? `, ${fmtDate(r.review_date)}` : ""}
            </span>
          </p>
        </li>
      ))}
    </ul>
  );
}
