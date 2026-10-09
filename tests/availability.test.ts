import { describe, expect, it } from "vitest";
import {
  bookableDateKeys,
  daysWithSlots,
  formatLocalTime,
  localDateKey,
  slotsForDay,
  weekdayOf,
  type AvailabilityRule,
  type BookingSettings,
} from "@/lib/booking/availability";

const TZ = "Europe/Berlin";
const settings: BookingSettings = { timezone: TZ, slotIntervalMinutes: 15, minNoticeHours: 12, maxDaysAhead: 60 };

// Filos Zeiten: Mo–Mi 10–19, Do 10–19:30, Fr 10–17
const rules: AvailabilityRule[] = [
  { day_of_week: 1, start_time: "10:00:00", end_time: "19:00:00" },
  { day_of_week: 2, start_time: "10:00:00", end_time: "19:00:00" },
  { day_of_week: 3, start_time: "10:00:00", end_time: "19:00:00" },
  { day_of_week: 4, start_time: "10:00:00", end_time: "19:30:00" },
  { day_of_week: 5, start_time: "10:00:00", end_time: "17:00:00" },
];

const times = (slots: Date[]) => slots.map((s) => formatLocalTime(s, TZ));
// "Jetzt" weit genug vor den Testtagen, damit der Vorlauf nicht stört
const now = new Date("2026-10-01T08:00:00Z");

describe("Verfügbarkeit", () => {
  it("rechnet im 15-Minuten-Raster und endet rechtzeitig vor Feierabend", () => {
    // Montag 12.10.2026, 60 Min. Behandlung
    const slots = slotsForDay({ day: "2026-10-12", durationMinutes: 60, bufferMinutes: 15, rules, busy: [], settings, now });
    const t = times(slots);
    expect(t[0]).toBe("10:00");
    expect(t[1]).toBe("10:15");
    expect(t.at(-1)).toBe("18:00"); // 18:00 + 60 Min. = 19:00 Feierabend
    expect(t).toHaveLength(33);
  });

  it("ist am Wochenende geschlossen", () => {
    expect(slotsForDay({ day: "2026-10-10", durationMinutes: 30, bufferMinutes: 15, rules, busy: [], settings, now })).toEqual([]);
    expect(slotsForDay({ day: "2026-10-11", durationMinutes: 30, bufferMinutes: 15, rules, busy: [], settings, now })).toEqual([]);
  });

  it("hält Pufferzeit nach bestehenden Terminen und vor dem nächsten Termin frei", () => {
    // bestehender Termin 12:00–13:00, blockiert bis 13:15
    const busy = [{ start: "2026-10-12T12:00:00+02:00", end: "2026-10-12T13:15:00+02:00" }];
    const t = times(slotsForDay({ day: "2026-10-12", durationMinutes: 45, bufferMinutes: 15, rules, busy, settings, now }));
    // Neue Behandlung 45 Min. + 15 Min. Puffer: späteste Startzeit davor 11:00 (Ende inkl. Puffer 12:00)
    expect(t).toContain("11:00");
    expect(t).not.toContain("11:15");
    expect(t).not.toContain("12:00");
    expect(t).not.toContain("13:00");
    expect(t).toContain("13:15");
  });

  it("beachtet Sperrzeiten (Urlaub, privat)", () => {
    const busy = [{ start: "2026-10-12T00:00:00+02:00", end: "2026-10-13T00:00:00+02:00" }];
    expect(slotsForDay({ day: "2026-10-12", durationMinutes: 30, bufferMinutes: 15, rules, busy, settings, now })).toEqual([]);
  });

  it("verlangt 12 Stunden Vorlauf", () => {
    const evening = new Date("2026-10-11T20:00:00+02:00"); // Sonntag 20 Uhr
    const t = times(slotsForDay({ day: "2026-10-12", durationMinutes: 30, bufferMinutes: 15, rules, busy: [], settings, now: evening }));
    expect(t[0]).toBe("10:00"); // genau 14 Std. später ist ok
    const late = new Date("2026-10-11T23:00:00+02:00");
    const t2 = times(slotsForDay({ day: "2026-10-12", durationMinutes: 30, bufferMinutes: 15, rules, busy: [], settings, now: late }));
    expect(t2[0]).toBe("11:00");
  });

  it("bucht höchstens 60 Tage im Voraus", () => {
    const keys = bookableDateKeys(now, settings);
    expect(keys[0]).toBe("2026-10-01");
    expect(keys).toHaveLength(61);
    expect(keys.at(-1)).toBe("2026-11-30");
    expect(slotsForDay({ day: "2026-12-01", durationMinutes: 30, bufferMinutes: 15, rules, busy: [], settings, now })).toEqual([]);
  });

  it("stimmt bei der Umstellung auf Winterzeit (25.10.2026)", () => {
    // Montag nach der Umstellung: 10:00 Ortszeit = 09:00 UTC
    const slots = slotsForDay({ day: "2026-10-26", durationMinutes: 60, bufferMinutes: 15, rules, busy: [], settings, now });
    expect(slots[0].toISOString()).toBe("2026-10-26T09:00:00.000Z");
    // Freitag davor (Sommerzeit): 10:00 Ortszeit = 08:00 UTC
    const before = slotsForDay({ day: "2026-10-23", durationMinutes: 60, bufferMinutes: 15, rules, busy: [], settings, now });
    expect(before[0].toISOString()).toBe("2026-10-23T08:00:00.000Z");
    // Die Tagesliste überspringt keinen Tag
    const keys = bookableDateKeys(new Date("2026-10-20T10:00:00Z"), settings);
    expect(keys.slice(4, 8)).toEqual(["2026-10-24", "2026-10-25", "2026-10-26", "2026-10-27"]);
  });

  it("stimmt bei der Umstellung auf Sommerzeit (29.03.2027)", () => {
    const spring = new Date("2027-03-20T10:00:00Z");
    const slots = slotsForDay({ day: "2027-03-29", durationMinutes: 30, bufferMinutes: 15, rules, busy: [], settings, now: spring });
    expect(slots[0].toISOString()).toBe("2027-03-29T08:00:00.000Z");
  });

  it("erkennt Wochentage und Datum in Berliner Zeit", () => {
    expect(weekdayOf("2026-10-12", TZ)).toBe(1);
    // 23:30 UTC am 24.10. ist in Berlin schon der 25.10.
    expect(localDateKey(new Date("2026-10-24T23:30:00Z"), TZ)).toBe("2026-10-25");
  });

  it("mehrere Zeitfenster am Tag (Mittagspause) und Behandlung, die nicht hineinpasst", () => {
    const split: AvailabilityRule[] = [
      { day_of_week: 1, start_time: "10:00", end_time: "13:00" },
      { day_of_week: 1, start_time: "14:00", end_time: "19:00" },
    ];
    const t = times(slotsForDay({ day: "2026-10-12", durationMinutes: 90, bufferMinutes: 15, rules: split, busy: [], settings, now }));
    expect(t).toContain("11:30");
    expect(t).not.toContain("11:45"); // würde in die Pause ragen
    expect(t).not.toContain("13:00");
    expect(t).toContain("14:00");
    const long = slotsForDay({ day: "2026-10-12", durationMinutes: 600, bufferMinutes: 0, rules: split, busy: [], settings, now });
    expect(long).toEqual([]);
  });

  it("liefert die Tage mit freien Zeiten für den Kalender", () => {
    const days = daysWithSlots({ durationMinutes: 60, bufferMinutes: 15, rules, busy: [], settings, now });
    expect(days).not.toContain("2026-10-03"); // Samstag
    expect(days).toContain("2026-10-05"); // Montag
  });
});
