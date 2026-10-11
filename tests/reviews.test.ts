import { describe, expect, it } from "vitest";
import { formatRating, hasSummary, parseSummary } from "@/lib/reviews";

describe("Bewertungs-Übersicht", () => {
  it("formatiert den Schnitt auf Deutsch", () => {
    expect(formatRating(4.9)).toBe("4,9");
    expect(formatRating(5)).toBe("5,0");
  });
  it("zeigt nur vollständige, plausible Angaben", () => {
    expect(hasSummary({ rating: 4.9, count: 112 })).toBe(true);
    expect(hasSummary({ rating: 4.9, count: null })).toBe(false);
    expect(hasSummary({ rating: 6, count: 10 })).toBe(false);
    expect(hasSummary({ rating: null, count: 10 })).toBe(false);
  });
  it("liest gespeicherte Werte robust ein", () => {
    expect(parseSummary(null).google.rating).toBeNull();
    const s = parseSummary({ google: { rating: 4.8, count: 20 }, planity: { rating: "x", count: 110, url: "https://p" } });
    expect(s.google).toEqual({ rating: 4.8, count: 20 });
    expect(s.planity).toEqual({ rating: null, count: 110, url: "https://p" });
  });
});
