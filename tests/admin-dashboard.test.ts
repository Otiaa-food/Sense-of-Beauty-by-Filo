import { describe, expect, it } from "vitest";
import { niceTicks } from "@/components/admin/charts";
import { daysForView, hourRange, monthCells, parseView, placeOnDay, shiftDay } from "@/lib/admin/calendar";
import { greeting, monthInsights, periodComparison, weeklyRevenue } from "@/lib/overview";
import { computeStats, topSlices } from "@/lib/stats";

const tz = "Europe/Berlin";

describe("Kalender-Ansichten", () => {
  it("Ansicht und Tage", () => {
    expect(parseView("monat")).toBe("monat");
    expect(parseView("quatsch")).toBe("woche");
    expect(daysForView("woche", "2026-10-14")).toEqual(["2026-10-12", "2026-10-13", "2026-10-14", "2026-10-15", "2026-10-16", "2026-10-17", "2026-10-18"]);
    expect(daysForView("tag", "2026-10-14")).toEqual(["2026-10-14"]);
    const m = monthCells("2026-10");
    expect(m).toHaveLength(42);
    expect(m[0]).toBe("2026-09-28");
    expect(m).toContain("2026-10-31");
  });

  it("blättert je nach Ansicht", () => {
    expect(shiftDay("tag", "2026-10-31", 1)).toBe("2026-11-01");
    expect(shiftDay("woche", "2026-10-14", -1)).toBe("2026-10-07");
    expect(shiftDay("monat", "2026-01-31", -1)).toBe("2025-12-01");
  });

  it("legt Termine richtig ins Raster (Ortszeit, Sommer/Winter)", () => {
    // 14.10.2026 10:00–11:30 Sommerzeit = 08:00–09:30 UTC
    expect(placeOnDay("2026-10-14T08:00:00Z", "2026-10-14T09:30:00Z", "2026-10-14", 9, 20, tz)).toEqual({ top: 60, height: 90 });
    // 26.10.2026 Winterzeit: 10:00 = 09:00 UTC
    expect(placeOnDay("2026-10-26T09:00:00Z", "2026-10-26T10:00:00Z", "2026-10-26", 9, 20, tz)).toEqual({ top: 60, height: 60 });
    expect(placeOnDay("2026-10-14T08:00:00Z", "2026-10-14T09:30:00Z", "2026-10-15", 9, 20, tz)).toBeNull();
    // Urlaub über mehrere Tage: mittlerer Tag ganz gesperrt (im sichtbaren Bereich)
    expect(placeOnDay("2026-10-13T22:00:00Z", "2026-10-16T22:00:00Z", "2026-10-15", 9, 20, tz)).toEqual({ top: 0, height: 11 * 60 });
  });

  it("zeigt mindestens 9 bis 19 Uhr, erweitert für Arbeitszeiten und Termine", () => {
    expect(hourRange([], [], tz)).toEqual({ fromHour: 9, toHour: 19 });
    expect(hourRange([{ start_time: "10:00:00", end_time: "19:30:00" }], [], tz)).toEqual({ fromHour: 9, toHour: 20 });
    expect(hourRange([], [{ start: "2026-10-14T05:30:00Z", end: "2026-10-14T06:30:00Z" }], tz)).toEqual({ fromHour: 7, toHour: 19 });
  });
});

describe("Diagramme", () => {
  it("runde Achsenwerte", () => {
    expect(niceTicks(775)).toEqual([0, 200, 400, 600, 800]);
    expect(niceTicks(130)).toEqual([0, 50, 100, 150]);
    expect(niceTicks(0)).toEqual([0]);
  });

  it("Kreisdiagramm: größte Stücke, Rest als „Weitere“", () => {
    const s = topSlices([
      { label: "A", value: 5 },
      { label: "B", value: 1 },
      { label: "C", value: 9 },
      { label: "D", value: 3 },
      { label: "E", value: 2 },
      { label: "F", value: 1 },
      { label: "G", value: 0 },
    ]);
    expect(s.map((x) => x.label)).toEqual(["C", "A", "D", "E", "Weitere"]);
    expect(s.at(-1)!.value).toBe(2);
    expect(topSlices([{ label: "A", value: 1 }, { label: "B", value: 2 }])).toHaveLength(2);
  });

  it("Statistik liefert Daten für die vier Kreise", () => {
    const rows = [
      { start_time: "2026-10-02T08:00:00Z", status: "completed", price: 130, source: "online", customer_id: "a", customer_name: "A", service_name: "Aqua", category_name: "Korean Facials" },
      { start_time: "2026-10-03T08:00:00Z", status: "completed", price: 50, source: "admin", customer_id: "b", customer_name: "B", service_name: "Lift", category_name: "Lashes" },
      { start_time: "2026-10-04T08:00:00Z", status: "cancelled", price: 50, source: "online", customer_id: "c", customer_name: "C", service_name: "Lift", category_name: "Lashes" },
      { start_time: "2026-10-05T08:00:00Z", status: "no_show", price: 50, source: "online", customer_id: "c", customer_name: "C", service_name: "Lift", category_name: "Lashes" },
    ];
    const s = computeStats(rows, { from: "2026-10-01", to: "2026-10-31" }, new Set(["b"]), tz, new Date("2026-10-12T10:00:00Z"));
    expect(s.byCategory).toEqual([
      { label: "Korean Facials", value: 130 },
      { label: "Lashes", value: 50 },
    ]);
    expect(s.customerMix).toEqual([
      { label: "Neukundinnen", value: 1 },
      { label: "Stammkundinnen", value: 1 },
    ]);
    expect(s.channel.map((x) => x.value)).toEqual([2, 1]);
    expect(s.outcomes.map((x) => x.value)).toEqual([2, 1, 1]);
  });
});

describe("Übersicht", () => {
  const r = (start: string, price: number, status = "completed", source = "online") => ({ start_time: start, price, status, source });

  it("Wochenumsatz der letzten 12 Wochen", () => {
    const w = weeklyRevenue([r("2026-10-12T08:00:00Z", 100), r("2026-10-05T08:00:00Z", 50), r("2026-10-06T08:00:00Z", 30, "cancelled")], "2026-10-14", tz);
    expect(w).toHaveLength(12);
    expect(w.at(-1)).toEqual({ label: "12.10.", value: 100 });
    expect(w.at(-2)!.value).toBe(50);
  });

  it("fairer Vergleich: gleiche Tage im Vormonat und in der Vorwoche", () => {
    const rows = [
      r("2026-10-02T08:00:00Z", 100), // Oktober bis heute
      r("2026-10-13T08:00:00Z", 80), // diese Woche (Di)
      r("2026-09-10T08:00:00Z", 50), // Vormonat bis zum 14.
      r("2026-09-20T08:00:00Z", 999), // Vormonat nach dem 14. -> zählt nicht
      r("2026-10-06T08:00:00Z", 40), // Vorwoche Di
      r("2026-10-08T08:00:00Z", 999), // Vorwoche Do -> nach dem Vergleichstag
    ];
    const c = periodComparison(rows, "2026-10-14", tz);
    expect(c.monthRevenue).toBe(100 + 80 + 40 + 999);
    expect(c.prevMonthRevenue).toBe(50);
    expect(c.weekRevenue).toBe(80);
    expect(c.prevWeekRevenue).toBe(40);
  });

  it("Monatsfazit aus echten Zahlen", () => {
    const base = { monthVisits: 10, monthOnline: 6, monthBooked: 10, weekRevenue: 0, prevWeekRevenue: 0 };
    expect(monthInsights({ ...base, monthRevenue: 1200, prevMonthRevenue: 1000 }, { waitlist: 0 }).headline).toContain("+20");
    const slow = monthInsights({ ...base, monthRevenue: 700, prevMonthRevenue: 1000 }, { waitlist: 2 });
    expect(slow.headline).toContain("ruhiger");
    expect(slow.items.map((i) => i.href)).toContain("/admin/kampagnen");
    expect(slow.items).toHaveLength(3);
    expect(monthInsights({ ...base, monthVisits: 0, monthRevenue: 0, prevMonthRevenue: 0 }, { waitlist: 0 }).headline).toContain("begonnen");
    expect(greeting(8)).toBe("Guten Morgen");
    expect(greeting(20)).toBe("Guten Abend");
  });
});
