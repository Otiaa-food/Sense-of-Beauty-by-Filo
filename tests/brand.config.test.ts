import { describe, expect, it } from "vitest";
import { brand, formatAddress, mapsDirectionsUrl, openingHours } from "@/lib/brand.config";

describe("brand.config", () => {
  it("deckt alle sieben Wochentage genau einmal ab", () => {
    const days = openingHours.map((d) => d.dayOfWeek).sort();
    expect(days).toEqual([0, 1, 2, 3, 4, 5, 6]);
  });

  it("hat Filos Öffnungszeiten", () => {
    const byDay = new Map(openingHours.map((d) => [d.dayOfWeek, d]));
    expect(byDay.get(1)).toMatchObject({ open: "10:00", close: "19:00" });
    expect(byDay.get(4)).toMatchObject({ open: "10:00", close: "19:30" });
    expect(byDay.get(5)).toMatchObject({ open: "10:00", close: "17:00" });
    expect(byDay.get(6)).toMatchObject({ open: null, close: null });
    expect(byDay.get(0)).toMatchObject({ open: null, close: null });
  });

  it("öffnet immer vor dem Schließen", () => {
    for (const d of openingHours) {
      if (d.open && d.close) expect(d.open < d.close).toBe(true);
    }
  });

  it("nutzt Berliner Zeit und Euro", () => {
    expect(brand.timezone).toBe("Europe/Berlin");
    expect(brand.currency).toBe("EUR");
  });

  it("formatiert Adresse und Routen-Link", () => {
    expect(formatAddress()).toBe("Luitgardstraße 14-18, 2. OG, 75177 Pforzheim");
    expect(mapsDirectionsUrl()).toContain("google.com/maps");
  });
});
