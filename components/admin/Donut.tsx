"use client";

import { useState } from "react";

/**
 * Kreisdiagramm (Ring), das sich beim Öffnen im Uhrzeigersinn füllt.
 * Beim Drüberfahren zeigt die Mitte den Wert des Stücks, sonst die Summe.
 * Die Legende daneben nennt alle Werte (Farbe ist nie die einzige Information).
 */

// Geprüfte Reihenfolge (siehe docs/styleguide.md, Abschnitt Diagramme). „Weitere" ist immer grau.
const palette = ["var(--d1)", "var(--d2)", "var(--d3)", "var(--d4)", "var(--d5)"];

type Slice = { label: string; value: number };

const fmt = {
  euro: new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }),
  number: new Intl.NumberFormat("de-DE", { maximumFractionDigits: 0 }),
};
const pct = new Intl.NumberFormat("de-DE", { style: "percent", maximumFractionDigits: 0 });

export function Donut({
  slices,
  format = "number",
  centerLabel,
  empty = "Noch keine Daten im Zeitraum.",
  delay = 0,
}: {
  slices: Slice[];
  format?: "euro" | "number";
  centerLabel: string;
  empty?: string;
  delay?: number;
}) {
  const [active, setActive] = useState<number | null>(null);
  const total = slices.reduce((s, x) => s + x.value, 0);
  if (total === 0) return <p className="py-10 text-center text-sm text-muted">{empty}</p>;

  const colorOf = (i: number) => (slices[i].label === "Weitere" ? "var(--d-other)" : palette[i % palette.length]);
  const visible = slices.filter((s) => s.value > 0).length;
  const gap = visible > 1 ? 0.9 : 0; // schmale Lücke in Flächenfarbe zwischen den Stücken
  const duration = 1.1;

  const shares = slices.map((s) => (s.value / total) * 100);
  const segments = shares.map((share, i) => ({ i, share, start: shares.slice(0, i).reduce((a, b) => a + b, 0) }));

  const shown = active === null ? null : slices[active];

  return (
    <div className="@container">
    <div className="flex flex-col items-center gap-5 @md:flex-row @md:gap-6">
      <div className="relative h-40 w-40 shrink-0">
        <svg viewBox="0 0 42 42" className="h-full w-full -rotate-90" role="img" aria-label={`${centerLabel}: ${slices.map((s) => `${s.label} ${fmt[format].format(s.value)}`).join(", ")}`}>
          <circle cx="21" cy="21" r="15.915" fill="none" stroke="var(--blush)" strokeWidth="5" />
          {segments.map(({ i, share, start: from }) =>
            share > 0 ? (
              <circle
                key={slices[i].label}
                cx="21"
                cy="21"
                r="15.915"
                fill="none"
                stroke={colorOf(i)}
                strokeWidth={active === i ? 6.2 : 5}
                strokeDasharray={`${Math.max(0, share - gap)} ${100 - Math.max(0, share - gap)}`}
                strokeDashoffset={-from}
                className="anim-ring cursor-pointer transition-[stroke-width] duration-200"
                style={{ "--delay": `${delay + (from / 100) * duration}s`, "--dur": `${Math.max(0.2, (share / 100) * duration)}s` } as React.CSSProperties}
                onMouseEnter={() => setActive(i)}
                onMouseLeave={() => setActive(null)}
              />
            ) : null,
          )}
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-2xl font-light text-espresso">
            {shown ? pct.format(shown.value / total) : fmt[format].format(total)}
          </span>
          <span className="mt-0.5 max-w-[6.5rem] text-[0.68rem] leading-tight text-muted">{shown ? shown.label : centerLabel}</span>
        </div>
      </div>
      <ul className="w-full min-w-0 space-y-2.5 text-sm">
        {slices.map((s, i) => (
          <li
            key={s.label}
            className={`flex items-center gap-2.5 rounded-lg px-2 py-1 transition-colors ${active === i ? "bg-sand" : ""}`}
            onMouseEnter={() => setActive(i)}
            onMouseLeave={() => setActive(null)}
          >
            <span aria-hidden="true" className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: colorOf(i) }} />
            <span className="min-w-0 flex-1 truncate text-espresso" title={s.label}>{s.label}</span>
            <span className="shrink-0 text-muted">
              {fmt[format].format(s.value)} <span className="ml-1 text-xs">{pct.format(s.value / total)}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
    </div>
  );
}
