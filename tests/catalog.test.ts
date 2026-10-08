import { describe, expect, it } from "vitest";
import { formatDuration, formatPrice, groupCatalog, lowestPrice, type CatalogCategory, type CatalogService } from "@/lib/catalog";

const cat = (id: string, sort_order: number): CatalogCategory => ({ id, slug: id, name: id, description: null, sort_order });
const svc = (id: string, category_id: string, sort_order: number, price = 10): CatalogService => ({
  id, category_id, name: id, slug: id, description: null, duration_minutes: 30, price,
  online_booking_enabled: true, addon_only: false, sort_order,
});

describe("catalog", () => {
  it("formatiert Preise auf Deutsch", () => {
    expect(formatPrice(130).replace(/\s/g, " ")).toBe("130 €");
    expect(formatPrice(12.5).replace(/\s/g, " ")).toBe("12,50 €");
  });

  it("formatiert Dauer", () => {
    expect(formatDuration(15)).toBe("15 Min.");
    expect(formatDuration(60)).toBe("1 Std.");
    expect(formatDuration(80)).toBe("1 Std. 20 Min.");
    expect(formatDuration(90)).toBe("1 Std. 30 Min.");
  });

  it("gruppiert nach Kategorie, sortiert und lässt leere Kategorien weg", () => {
    const groups = groupCatalog([cat("b", 2), cat("a", 1), cat("leer", 3)], [svc("b2", "b", 2), svc("a1", "a", 1), svc("b1", "b", 1)]);
    expect(groups.map((g) => g.category.id)).toEqual(["a", "b"]);
    expect(groups[1].services.map((s) => s.id)).toEqual(["b1", "b2"]);
  });

  it("findet den günstigsten Preis", () => {
    expect(lowestPrice([svc("x", "a", 1, 45), svc("y", "a", 2, 25)])).toBe(25);
    expect(lowestPrice([])).toBeNull();
  });
});
