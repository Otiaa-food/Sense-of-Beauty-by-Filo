import { describe, expect, it } from "vitest";
import { addDays, addMonths, formatDay, monthGrid } from "@/components/booking/calendar";
import { parseBooking } from "@/lib/booking/schema";

describe("Kalender", () => {
  it("baut Wochen mit Montag zuerst", () => {
    const weeks = monthGrid("2026-10"); // 1.10.2026 ist ein Donnerstag
    expect(weeks[0]).toEqual([null, null, null, "2026-10-01", "2026-10-02", "2026-10-03", "2026-10-04"]);
    expect(weeks.flat().filter(Boolean)).toHaveLength(31);
  });
  it("rechnet Tage und Monate über Grenzen", () => {
    expect(addDays("2026-10-31", 1)).toBe("2026-11-01");
    expect(addDays("2026-10-24", 2)).toBe("2026-10-26"); // über die Zeitumstellung
    expect(addMonths("2026-12", 1)).toBe("2027-01");
    expect(formatDay("2026-10-12")).toBe("Montag, 12. Oktober");
  });
});

function form(over: Record<string, string> = {}) {
  const f = new FormData();
  const base: Record<string, string> = {
    service: "korean-glass-skin-aquafacial",
    start: "2026-10-12T10:00:00.000Z",
    firstName: "Maria",
    lastName: "Müller",
    email: "maria@example.com",
    phone: "+49 170 1234567",
    notes: "",
    terms: "on",
    website: "",
    renderedAt: "0",
    ...over,
  };
  for (const [k, v] of Object.entries(base)) f.set(k, v);
  return f;
}

describe("Buchungsformular", () => {
  it("akzeptiert vollständige Angaben", () => {
    const r = parseBooking(form(), 10_000);
    expect(r.ok).toBe(true);
    expect(r.spam).toBe(false);
  });
  it("meldet fehlende Pflichtfelder verständlich", () => {
    const r = parseBooking(form({ email: "kaputt", terms: "" }), 10_000);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.fieldErrors?.email).toMatch(/E-Mail/);
      expect(r.fieldErrors?.terms).toMatch(/Stornierungsbedingungen/);
    }
  });
  it("erkennt Spam (verstecktes Feld ausgefüllt oder zu schnell abgeschickt)", () => {
    expect(parseBooking(form({ website: "http://spam" }), 10_000).spam).toBe(true);
    expect(parseBooking(form({ renderedAt: "9000" }), 10_000).spam).toBe(true);
  });
});
