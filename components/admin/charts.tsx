import Link from "next/link";

/**
 * Einfache Diagramme ohne Zusatz-Bibliothek: reines HTML/CSS, vom Server gerendert.
 * Jede Zahl steht auch als Text da (lesbar ohne Farben, für Screenreader und am Handy).
 */

const euro = (n: number) => new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);
const pct = (n: number) => new Intl.NumberFormat("de-DE", { style: "percent", maximumFractionDigits: 0, signDisplay: "always" }).format(n);

export function Kpi({
  label,
  value,
  hint,
  delta,
  lowerIsBetter,
}: {
  label: string;
  value: string;
  hint?: string;
  delta?: number | null;
  lowerIsBetter?: boolean;
}) {
  const good = delta == null || delta === 0 ? null : lowerIsBetter ? delta < 0 : delta > 0;
  return (
    <div className="bg-white p-5">
      <p className="label !text-[0.6rem] text-muted">{label}</p>
      <p className="mt-2 text-3xl font-light text-espresso">{value}</p>
      <p className="mt-1 min-h-5 text-xs text-muted">
        {delta != null ? (
          <span className={good === null ? "" : good ? "text-espresso" : "text-taupe"}>
            <span aria-hidden="true">{delta > 0 ? "▲" : delta < 0 ? "▼" : "•"}</span> {pct(delta)} zu vorher
          </span>
        ) : null}
        {delta != null && hint ? ", " : null}
        {hint}
      </p>
    </div>
  );
}

export function TimelineChart({ buckets, format }: { buckets: { key: string; label: string; revenue: number; count: number }[]; format: "euro" }) {
  const max = Math.max(1, ...buckets.map((b) => b.revenue));
  const total = buckets.reduce((s, b) => s + b.revenue, 0);
  if (total === 0) return <p className="mt-4 border border-line bg-white p-5 text-muted">Im Zeitraum noch kein Umsatz mit „Erschienen“.</p>;
  // Nur jede n-te Beschriftung, damit es am Handy lesbar bleibt
  const every = buckets.length > 8 ? Math.ceil(buckets.length / 7) : 1;
  return (
    <figure className="mt-4 border border-line bg-white p-5">
      <div className="flex h-56 items-end gap-1 sm:gap-1.5" role="list" aria-label="Umsatz im Zeitverlauf">
        {buckets.map((b) => (
          <div key={b.key} role="listitem" className="group relative flex h-full min-w-0 flex-1 flex-col justify-end">
            <span className="sr-only">
              {b.label}: {format === "euro" ? euro(b.revenue) : b.revenue}, {b.count} Behandlungen
            </span>
            <span
              aria-hidden="true"
              className="pointer-events-none absolute -top-1 left-1/2 z-10 hidden -translate-x-1/2 -translate-y-full whitespace-nowrap bg-espresso px-2 py-1 text-xs text-white group-hover:block"
            >
              {euro(b.revenue)} · {b.count}×
            </span>
            <div
              aria-hidden="true"
              className="w-full bg-espresso transition-colors group-hover:bg-taupe"
              style={{ height: `${Math.max(b.revenue > 0 ? 2 : 0, (b.revenue / max) * 100)}%` }}
            />
          </div>
        ))}
      </div>
      <div aria-hidden="true" className="mt-2 flex gap-1 border-t border-line pt-2 sm:gap-1.5">
        {buckets.map((b, i) => (
          <span key={b.key} className="min-w-0 flex-1 overflow-visible whitespace-nowrap text-[0.65rem] text-muted">
            {i % every === 0 ? b.label : ""}
          </span>
        ))}
      </div>
      <figcaption className="mt-3 text-sm text-muted">Höchster Wert: {euro(max)}. Fahre über einen Balken für Details.</figcaption>
    </figure>
  );
}

export function BarList({
  items,
  empty,
}: {
  items: { label: string; value: number; display?: string; note?: string; href?: string }[];
  empty: string;
}) {
  if (items.length === 0 || items.every((i) => i.value === 0)) return <p className="mt-4 border border-line bg-white p-5 text-muted">{empty}</p>;
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <ul className="mt-4 min-w-0 space-y-3 border border-line bg-white p-5">
      {items.map((i) => {
        const label = i.href ? (
          <Link href={i.href} className="underline-offset-4 hover:underline">
            {i.label}
          </Link>
        ) : (
          i.label
        );
        return (
          <li key={i.label}>
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="block min-w-0 flex-1 truncate text-espresso" title={i.label}>{label}</span>
              <span className="shrink-0 text-muted">
                <span className="text-espresso">{i.display ?? i.value}</span>
                {i.note ? <span className="ml-2">{i.note}</span> : null}
              </span>
            </div>
            <div aria-hidden="true" className="mt-1.5 h-2 bg-stone">
              <div className="h-full bg-espresso" style={{ width: `${(i.value / max) * 100}%` }} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
