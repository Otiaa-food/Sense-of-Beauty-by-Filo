"use client";

import { useEffect, useState } from "react";

type Format = "euro" | "number" | "percent";

const formatters: Record<Format, Intl.NumberFormat> = {
  euro: new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }),
  number: new Intl.NumberFormat("de-DE", { maximumFractionDigits: 0 }),
  percent: new Intl.NumberFormat("de-DE", { style: "percent", maximumFractionDigits: 0 }),
};

/**
 * Zahl, die beim Öffnen der Seite von 0 hochzählt (ca. 1 Sekunde).
 * Screenreader bekommen sofort den richtigen Wert. Wer weniger Bewegung möchte, sieht ihn direkt.
 */
export function CountUp({ value, format = "number", delay = 0 }: { value: number; format?: Format; delay?: number }) {
  const [shown, setShown] = useState(0);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let frame = 0;
    let start = 0;
    const duration = 1000;
    const tick = (t: number) => {
      if (!start) start = t + delay * 1000;
      const p = reduce ? 1 : Math.min(1, Math.max(0, (t - start) / duration));
      const eased = 1 - Math.pow(1 - p, 3);
      setShown(value * eased);
      if (p < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, delay]);

  const final = formatters[format].format(value);
  return (
    <>
      <span aria-hidden="true">{formatters[format].format(shown)}</span>
      <span className="sr-only">{final}</span>
    </>
  );
}
