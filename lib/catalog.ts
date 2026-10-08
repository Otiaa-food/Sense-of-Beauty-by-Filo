/** Reine Hilfsfunktionen für Behandlungen (ohne Datenbankzugriff, deshalb gut testbar). */

export type CatalogCategory = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  sort_order: number;
};

export type CatalogService = {
  id: string;
  category_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  duration_minutes: number;
  price: number;
  online_booking_enabled: boolean;
  addon_only: boolean;
  sort_order: number;
};

export type CatalogGroup = { category: CatalogCategory; services: CatalogService[] };

/** 130 → "130 €", 12.5 → "12,50 €" */
export function formatPrice(value: number): string {
  const whole = Number.isInteger(value);
  return (
    new Intl.NumberFormat("de-DE", {
      minimumFractionDigits: whole ? 0 : 2,
      maximumFractionDigits: 2,
    }).format(value) + " €"
  );
}

/** 45 → "45 Min.", 60 → "1 Std.", 80 → "1 Std. 20 Min." */
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} Min.`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h} Std.` : `${h} Std. ${m} Min.`;
}

/** Sortiert Kategorien und Behandlungen und lässt leere Kategorien weg. */
export function groupCatalog(categories: CatalogCategory[], services: CatalogService[]): CatalogGroup[] {
  return [...categories]
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((category) => ({
      category,
      services: services
        .filter((s) => s.category_id === category.id)
        .sort((a, b) => a.sort_order - b.sort_order),
    }))
    .filter((g) => g.services.length > 0);
}

/** Günstigster Preis einer Gruppe, für "ab 25 €". */
export function lowestPrice(services: CatalogService[]): number | null {
  return services.length ? Math.min(...services.map((s) => s.price)) : null;
}
