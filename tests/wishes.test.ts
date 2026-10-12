import { describe, expect, it } from "vitest";
import { birthdayKeys, parseBirthdayCampaign } from "@/lib/campaigns";
import { birthdayEmail, birthdaySms, campaignEmail, campaignSms, personalize, waitlistOfferEmail, waitlistOfferSms } from "@/lib/notify/templates";
import { change, computeStats, emptyBuckets, previousRange, resolveRange, type StatAppointment } from "@/lib/stats";
import { describeWindow, parseWaitlist, slotsInWindow } from "@/lib/waitlist";

const tz = "Europe/Berlin";

describe("Warteliste", () => {
  // Fr 13.11.2026, Winterzeit (UTC+1)
  const slots = ["09:00", "11:45", "12:00", "13:00", "14:45", "15:00", "17:30"].map((t) => {
    const [h, m] = t.split(":").map(Number);
    return new Date(Date.UTC(2026, 10, 13, h - 1, m));
  });

  it("findet nur Startzeiten im Wunschfenster (Ende ausgeschlossen)", () => {
    const hm = (d: Date[]) => d.map((x) => x.toISOString().slice(11, 16));
    expect(hm(slotsInWindow(slots, "12:00", "15:00", tz))).toEqual(["11:00", "12:00", "13:45"]);
    expect(slotsInWindow(slots, "00:00", "12:00", tz)).toHaveLength(2);
    expect(slotsInWindow(slots, "15:00:00", "23:59:00", tz)).toHaveLength(2);
    expect(slotsInWindow(slots, "00:00", "23:59", tz)).toHaveLength(7);
  });

  it("beschreibt Zeitfenster lesbar", () => {
    expect(describeWindow("12:00:00", "15:00:00")).toBe("Mittags (12 bis 15 Uhr)");
    expect(describeWindow("00:00:00", "23:59:00")).toBe("Egal, ganzer Tag");
    expect(describeWindow("13:00:00", "14:00:00")).toBe("13:00 bis 14:00 Uhr");
  });

  const form = (over: Record<string, string> = {}) => {
    const f = new FormData();
    const base = {
      service: "aquafacial",
      date: "2026-11-13",
      window: "mittag",
      firstName: "Bea",
      lastName: "B",
      phone: "0176 1234567",
      email: "",
      consent: "on",
      website: "",
      renderedAt: "0",
      ...over,
    };
    for (const [k, v] of Object.entries(base)) f.set(k, v);
    return f;
  };

  it("prüft Eingaben, E-Mail ist freiwillig, Zustimmung Pflicht", () => {
    expect(parseWaitlist(form(), 10_000)).toMatchObject({ ok: true, spam: false });
    const noConsent = parseWaitlist(form({ consent: "" }), 10_000);
    expect(noConsent.ok).toBe(false);
    expect(parseWaitlist(form({ window: "nachts" }), 10_000).ok).toBe(false);
    expect(parseWaitlist(form({ email: "kaputt" }), 10_000).ok).toBe(false);
    expect(parseWaitlist(form({ renderedAt: "9000" }), 10_000).spam).toBe(true);
    expect(parseWaitlist(form({ website: "spam" }), 10_000).spam).toBe(true);
  });

  it("SMS mit Filos Text, kurz genug für eine SMS", () => {
    const offer = {
      firstName: "Bea",
      serviceName: "Korean Glass Skin Aquafacial",
      start: new Date("2026-11-13T12:00:00Z"),
      bookUrl: "https://senseofbeautybyfilo.de/book?service=korean-glass-skin-aquafacial&tag=2026-11-13",
    };
    const sms = waitlistOfferSms(offer);
    expect(sms).toMatch(/^Hey Beauty, dein Termin ist verfügbar!/);
    expect(sms).toContain("13:00 Uhr");
    expect(sms).toContain(offer.bookUrl);
    const mail = waitlistOfferEmail(offer);
    expect(mail.subject).toContain("Hey Beauty");
    expect(mail.html).toContain("tag=2026-11-13");
  });
});

describe("Geburtstag", () => {
  it("erkennt den heutigen Tag in Pforzheim", () => {
    // 23:30 UTC am 11.3. ist in Pforzheim schon der 12.3.
    expect(birthdayKeys(new Date("2027-03-11T23:30:00Z"))).toEqual({ days: [12], month: 3, year: 2027 });
  });

  it("29. Februar wird in normalen Jahren am 28. gefeiert", () => {
    expect(birthdayKeys(new Date("2027-02-28T10:00:00Z")).days).toEqual([28, 29]);
    expect(birthdayKeys(new Date("2028-02-28T10:00:00Z")).days).toEqual([28]);
    expect(birthdayKeys(new Date("2028-02-29T10:00:00Z")).days).toEqual([29]);
  });

  it("Einstellungen haben sichere Standardwerte (aus)", () => {
    expect(parseBirthdayCampaign(null)).toMatchObject({ enabled: false, channel: "email", validDays: 30 });
    expect(parseBirthdayCampaign({ enabled: true, channel: "both", gift: " 10 % ", validDays: 999 })).toMatchObject({
      enabled: true,
      channel: "both",
      gift: "10 %",
      validDays: 365,
    });
  });

  it("Gruß enthält Geschenk, Code, Gültigkeit und Abmelde-Link", () => {
    const g = {
      firstName: "Maria",
      gift: "10 % Rabatt auf deine nächste Behandlung",
      code: "BDAY10",
      validUntil: new Date("2027-04-11T10:00:00Z"),
      bookUrl: "https://x.de/book",
      unsubscribeUrl: "https://x.de/abmelden/abc",
    };
    const m = birthdayEmail(g);
    expect(m.subject).toBe("Alles Liebe zum Geburtstag, Maria!");
    expect(m.text).toContain("BDAY10");
    expect(m.text).toContain("11. April 2027");
    expect(m.html).toContain(g.unsubscribeUrl);
    expect(birthdaySms(g)).toContain(g.unsubscribeUrl);
  });
});

describe("Rundnachricht", () => {
  it("setzt den Vornamen ein und schützt vor HTML", () => {
    expect(personalize("Hey {vorname}!", "Maria")).toBe("Hey Maria!");
    expect(personalize("Hey {Vorname}!", "")).toBe("Hey Beauty!");
    const m = campaignEmail({ subject: "Neu: {vorname}", body: "Hallo {vorname},\n\n<b>Angebot</b>", firstName: "Maria", bookUrl: "https://x.de/book", unsubscribeUrl: "https://x.de/u" });
    expect(m.subject).toBe("Neu: Maria");
    expect(m.html).toContain("&lt;b&gt;Angebot&lt;/b&gt;");
    expect(m.html).not.toContain("<b>Angebot");
    expect(m.text).toContain("https://x.de/u");
    expect(campaignSms({ body: "Hey {vorname}, Freitag frei!", firstName: "Bea", unsubscribeUrl: "https://x.de/u" })).toBe(
      "Hey Bea, Freitag frei! Abmelden: https://x.de/u",
    );
  });
});

describe("Statistik", () => {
  const now = new Date("2026-10-12T10:00:00Z");
  const row = (start: string, status: string, price: number, customer: string, service: string, source = "online"): StatAppointment => ({
    start_time: start,
    status,
    price,
    source,
    customer_id: customer,
    customer_name: customer.toUpperCase(),
    service_name: service,
  });

  it("Zeiträume", () => {
    expect(resolveRange({}, now, tz)).toMatchObject({ from: "2026-10-01", to: "2026-10-31", preset: "monat" });
    expect(resolveRange({ zeitraum: "vormonat" }, now, tz)).toMatchObject({ from: "2026-09-01", to: "2026-09-30" });
    expect(resolveRange({ zeitraum: "jahr" }, now, tz)).toMatchObject({ from: "2026-01-01", to: "2026-12-31" });
    expect(resolveRange({ zeitraum: "12monate" }, now, tz)).toMatchObject({ from: "2025-10-13", to: "2026-10-12" });
    expect(resolveRange({ von: "2026-10-20", bis: "2026-10-01" }, now, tz)).toMatchObject({ from: "2026-10-01", to: "2026-10-20", preset: "eigen" });
    expect(previousRange({ from: "2026-10-01", to: "2026-10-31" })).toEqual({ from: "2026-08-31", to: "2026-09-30" });
  });

  it("Wochen bei kurzen, Monate bei langen Zeiträumen", () => {
    const w = emptyBuckets({ from: "2026-10-01", to: "2026-10-31" });
    expect(w.unit).toBe("week");
    expect(w.buckets[0].key).toBe("2026-09-28");
    expect(w.buckets.at(-1)!.key).toBe("2026-10-26");
    const m = emptyBuckets({ from: "2026-01-01", to: "2026-12-31" });
    expect(m.unit).toBe("month");
    expect(m.buckets).toHaveLength(12);
  });

  it("rechnet Umsatz, Ausfälle, Neukundinnen und Ranglisten", () => {
    const rows = [
      row("2026-10-02T08:00:00Z", "completed", 130, "anna", "Aquafacial"),
      row("2026-10-05T08:00:00Z", "completed", 80, "anna", "Rücken", "admin"),
      row("2026-10-06T13:00:00Z", "completed", 130, "bea", "Aquafacial"),
      row("2026-10-07T08:00:00Z", "no_show", 130, "cara", "Aquafacial"),
      row("2026-10-08T08:00:00Z", "cancelled", 130, "dora", "Aquafacial"),
      row("2026-10-20T08:00:00Z", "confirmed", 95, "bea", "Lashes"),
      row("2026-09-20T08:00:00Z", "completed", 999, "anna", "Aquafacial"), // außerhalb
    ];
    const s = computeStats(rows, { from: "2026-10-01", to: "2026-10-31" }, new Set(["bea"]), tz, now);
    expect(s.revenue).toBe(340);
    expect(s.completed).toBe(3);
    expect(s.noShows).toBe(1);
    expect(s.noShowRate).toBeCloseTo(0.25);
    expect(s.cancelled).toBe(1);
    expect(s.upcoming).toBe(1);
    expect(s.upcomingRevenue).toBe(95);
    expect(s.newCustomers).toBe(1); // anna (bea war schon vorher da)
    expect(s.returningCustomers).toBe(1);
    expect(s.services[0]).toEqual({ name: "Aquafacial", count: 2, revenue: 260 });
    expect(s.customers[0]).toMatchObject({ id: "anna", visits: 2, revenue: 210 });
    expect(s.timeline.buckets.reduce((x, b) => x + b.revenue, 0)).toBe(340);
    expect(s.weekdays.find((d) => d.label === "Di")!.count).toBe(2); // 6.10. und 20.10.
    expect(s.onlineShare).toBeCloseTo(4 / 5);
    expect(change(120, 100)).toBeCloseTo(0.2);
    expect(change(5, 0)).toBeNull();
  });
});
