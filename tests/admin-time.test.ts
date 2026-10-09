import { describe, expect, it } from "vitest";
import { dateToLocal, dayRange, localToDate, mondayOf } from "@/lib/admin/time";

const TZ = "Europe/Berlin";

describe("Admin-Zeitumrechnung", () => {
  it("rechnet Formularzeit in echte Zeit um (Sommer und Winter)", () => {
    expect(localToDate("2026-10-23", "10:00", TZ)?.toISOString()).toBe("2026-10-23T08:00:00.000Z");
    expect(localToDate("2026-10-26", "10:00", TZ)?.toISOString()).toBe("2026-10-26T09:00:00.000Z");
    expect(localToDate("2026-10-26", "kaputt", TZ)).toBeNull();
  });
  it("zeigt echte Zeit wieder als Ortszeit", () => {
    expect(dateToLocal("2026-10-26T09:00:00.000Z", TZ)).toEqual({ date: "2026-10-26", time: "10:00" });
    expect(dateToLocal("2026-10-24T22:30:00.000Z", TZ)).toEqual({ date: "2026-10-25", time: "00:30" });
  });
  it("liefert Tagesgrenzen, auch am 25-Stunden-Tag der Zeitumstellung", () => {
    const r = dayRange("2026-10-25", TZ)!;
    expect(r.from.toISOString()).toBe("2026-10-24T22:00:00.000Z");
    expect(r.to.toISOString()).toBe("2026-10-25T23:00:00.000Z");
  });
  it("findet den Montag einer Woche", () => {
    expect(mondayOf("2026-10-09")).toBe("2026-10-05");
    expect(mondayOf("2026-10-12")).toBe("2026-10-12");
    expect(mondayOf("2026-10-18")).toBe("2026-10-12");
  });
});
