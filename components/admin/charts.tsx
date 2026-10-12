import type { LucideIcon } from "lucide-react";
import { TrendingDown, TrendingUp } from "lucide-react";
import Link from "next/link";
import { CountUp } from "@/components/admin/CountUp";

/**
 * Diagramme ohne Zusatz-Bibliothek: HTML/SVG vom Server, Bewegung über CSS (globals.css: anim-*).
 * Beim Öffnen wachsen Balken, Linien zeichnen sich, Zahlen zählen hoch. Einmal, gestaffelt, ca. 1 Sekunde.
 * Jede Zahl steht zusätzlich als Text da (für Screenreader und ohne Farben lesbar).
 */

const euro = (n: number) => new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);
const compactEuro = (n: number) =>
  n >= 1000 ? `${new Intl.NumberFormat("de-DE", { maximumFractionDigits: 1 }).format(n / 1000)}k €` : `${Math.round(n)} €`;
const signedPct = (n: number) => new Intl.NumberFormat("de-DE", { style: "percent", maximumFractionDigits: 0, signDisplay: "always" }).format(n);

/** Runde Achsenwerte: 0, 250, 500 … statt 0, 193, 386 */
export function niceTicks(max: number, count = 4): number[] {
  if (max <= 0) return [0];
  const raw = max / count;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw) ?? 10 * mag;
  const top = Math.ceil(max / step) * step;
  return Array.from({ length: Math.round(top / step) + 1 }, (_, i) => i * step);
}

export function Kpi({
  label,
  value,
  format = "number",
  icon: Icon,
  hint,
  delta,
  lowerIsBetter,
  index = 0,
}: {
  label: string;
  value: number;
  format?: "euro" | "number" | "percent";
  icon: LucideIcon;
  hint?: string;
  delta?: number | null;
  lowerIsBetter?: boolean;
  index?: number;
}) {
  const good = delta == null || delta === 0 ? null : lowerIsBetter ? delta < 0 : delta > 0;
  const Trend = delta != null && delta < 0 ? TrendingDown : TrendingUp;
  return (
    <div className="card anim-fade-up flex items-start gap-4 p-5" style={{ "--delay": `${index * 0.06}s` } as React.CSSProperties}>
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blush text-cocoa">
        <Icon size={19} strokeWidth={1.6} aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="text-sm text-muted">{label}</p>
        <p className="mt-1 text-[1.65rem] font-normal leading-tight text-espresso">
          <CountUp value={value} format={format} delay={index * 0.06} />
        </p>
        <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted">
          {delta != null ? (
            <span
              className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 font-medium ${
                good === null ? "bg-stone text-muted" : good ? "bg-[#e3efe9] text-[#24564d]" : "bg-[#f4dfd6] text-[#7a3518]"
              }`}
            >
              <Trend size={12} aria-hidden="true" /> {signedPct(delta)}
            </span>
          ) : null}
          {hint ? <span>{hint}</span> : null}
        </p>
      </div>
    </div>
  );
}

type Bucket = { key: string; label: string; revenue: number; count: number };

/** Säulen je Woche oder Monat, wachsen beim Öffnen von unten hoch */
export function TimelineChart({ buckets }: { buckets: Bucket[] }) {
  const total = buckets.reduce((s, b) => s + b.revenue, 0);
  if (total === 0) return <p className="py-12 text-center text-sm text-muted">Im Zeitraum noch kein Umsatz mit „Erschienen“.</p>;
  const ticks = niceTicks(Math.max(...buckets.map((b) => b.revenue)));
  const top = ticks.at(-1)!;
  const every = buckets.length > 8 ? Math.ceil(buckets.length / 7) : 1;
  return (
    <figure>
      <div className="relative ml-12 h-60">
        {/* Hilfslinien mit Achsenwerten */}
        {ticks.map((t) => (
          <div key={t} aria-hidden="true" className="absolute inset-x-0 border-t border-card-line" style={{ bottom: `${(t / top) * 100}%` }}>
            <span className="absolute -left-12 -translate-y-1/2 text-[0.68rem] tabular-nums text-muted">{compactEuro(t)}</span>
          </div>
        ))}
        <ul className="absolute inset-0 flex items-end gap-1" aria-label="Umsatz im Zeitverlauf">
          {buckets.map((b, i) => (
            <li key={b.key} className="group relative flex h-full flex-1 items-end justify-center">
              <span className="sr-only">
                {b.label}: {euro(b.revenue)}, {b.count} Behandlungen
              </span>
              <span
                aria-hidden="true"
                className="pointer-events-none absolute z-10 hidden -translate-y-2 whitespace-nowrap rounded-lg bg-espresso px-2.5 py-1.5 text-xs text-white shadow-lg group-hover:block"
                style={{ bottom: `${(b.revenue / top) * 100}%` }}
              >
                {b.label}: {euro(b.revenue)} · {b.count}×
              </span>
              <div
                aria-hidden="true"
                className="anim-grow-y w-full max-w-6 rounded-t-[4px] bg-cocoa transition-colors group-hover:bg-caramel"
                style={{ height: `${(b.revenue / top) * 100}%`, "--delay": `${0.15 + i * 0.04}s` } as React.CSSProperties}
              />
            </li>
          ))}
        </ul>
      </div>
      <div aria-hidden="true" className="ml-12 mt-2 flex gap-1">
        {buckets.map((b, i) => (
          <span key={b.key} className="flex-1 whitespace-nowrap text-center text-[0.68rem] text-muted">
            {i % every === 0 ? b.label : ""}
          </span>
        ))}
      </div>
    </figure>
  );
}

/** Linie mit leichter Fläche darunter, zeichnet sich beim Öffnen von links nach rechts */
export function AreaChart({ points }: { points: { label: string; value: number }[] }) {
  if (points.length < 2 || points.every((p) => p.value === 0)) {
    return <p className="py-12 text-center text-sm text-muted">Noch kein Umsatz mit „Erschienen“ in den letzten Wochen.</p>;
  }
  const ticks = niceTicks(Math.max(...points.map((p) => p.value)));
  const top = ticks.at(-1)!;
  const W = 100;
  const H = 100;
  const x = (i: number) => (i / (points.length - 1)) * W;
  const y = (v: number) => H - (v / top) * H;
  const line = points.map((p, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(2)},${y(p.value).toFixed(2)}`).join(" ");
  const area = `${line} L${W},${H} L0,${H} Z`;
  const last = points.at(-1)!;
  const every = points.length > 8 ? Math.ceil(points.length / 6) : 1;
  return (
    <figure>
      <div className="relative ml-12 h-52">
        {ticks.map((t) => (
          <div key={t} aria-hidden="true" className="absolute inset-x-0 border-t border-card-line" style={{ bottom: `${(t / top) * 100}%` }}>
            <span className="absolute -left-12 -translate-y-1/2 text-[0.68rem] tabular-nums text-muted">{compactEuro(t)}</span>
          </div>
        ))}
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="anim-reveal absolute inset-0 h-full w-full overflow-visible" aria-hidden="true">
          <defs>
            <linearGradient id="area-wash" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="var(--cocoa)" stopOpacity="0.18" />
              <stop offset="100%" stopColor="var(--cocoa)" stopOpacity="0.02" />
            </linearGradient>
          </defs>
          <path d={area} fill="url(#area-wash)" />
          <path d={line} fill="none" stroke="var(--cocoa)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        </svg>
        {/* Endpunkt mit Wert, Hover-Flächen je Punkt */}
        <span
          aria-hidden="true"
          className="anim-fade-in absolute h-3 w-3 -translate-x-1/2 translate-y-1/2 rounded-full border-2 border-card bg-cocoa"
          style={{ left: "100%", bottom: `${(last.value / top) * 100}%`, "--delay": "1.4s" } as React.CSSProperties}
        />
        <ul className="absolute inset-0 flex" aria-label="Umsatz je Woche">
          {points.map((p, i) => (
            <li key={p.label + i} className="group relative h-full flex-1">
              <span className="sr-only">
                {p.label}: {euro(p.value)}
              </span>
              <span
                aria-hidden="true"
                className="pointer-events-none absolute left-1/2 z-10 hidden -translate-x-1/2 -translate-y-3 whitespace-nowrap rounded-lg bg-espresso px-2.5 py-1.5 text-xs text-white shadow-lg group-hover:block"
                style={{ bottom: `${(p.value / top) * 100}%` }}
              >
                {p.label}: {euro(p.value)}
              </span>
              <span aria-hidden="true" className="absolute inset-y-0 left-1/2 hidden w-px bg-caramel/60 group-hover:block" />
            </li>
          ))}
        </ul>
      </div>
      <div aria-hidden="true" className="ml-12 mt-2 flex justify-between text-[0.68rem] text-muted">
        {points.map((p, i) => (
          <span key={p.label + i} className={i % every === 0 || i === points.length - 1 ? "" : "invisible"}>
            {p.label}
          </span>
        ))}
      </div>
    </figure>
  );
}

/** Waagerechte Balken (Ranglisten), wachsen beim Öffnen von links */
export function BarList({
  items,
  empty,
}: {
  items: { label: string; value: number; display?: string; note?: string; href?: string }[];
  empty: string;
}) {
  if (items.length === 0 || items.every((i) => i.value === 0)) return <p className="py-8 text-center text-sm text-muted">{empty}</p>;
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <ul className="min-w-0 space-y-3.5">
      {items.map((i, n) => {
        const label = i.href ? (
          <Link href={i.href} className="underline-offset-4 hover:text-cocoa hover:underline">
            {i.label}
          </Link>
        ) : (
          i.label
        );
        return (
          <li key={i.label} className="group">
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="block min-w-0 flex-1 truncate text-espresso" title={i.label}>
                {label}
              </span>
              <span className="shrink-0 text-muted">
                <span className="font-medium text-espresso">{i.display ?? i.value}</span>
                {i.note ? <span className="ml-2 text-xs">{i.note}</span> : null}
              </span>
            </div>
            <div aria-hidden="true" className="mt-1.5 h-2 overflow-hidden rounded-full bg-blush">
              <div
                className="anim-grow-x h-full rounded-full bg-cocoa transition-colors group-hover:bg-caramel"
                style={{ width: `${(i.value / max) * 100}%`, "--delay": `${0.1 + n * 0.06}s` } as React.CSSProperties}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
