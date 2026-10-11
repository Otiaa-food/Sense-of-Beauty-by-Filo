import { describe, expect, it } from "vitest";
import { buildIcs } from "@/lib/notify/ics";
import { normalizePhone } from "@/lib/notify/phone";
import {
  cancellationEmail,
  confirmationEmail,
  rebookEmail,
  reminderEmail,
  reminderSms,
  reviewRequestEmail,
} from "@/lib/notify/templates";

const appt = {
  firstName: "Maria",
  serviceName: "Korean Glass Skin Aquafacial",
  start: new Date("2026-10-26T09:00:00Z"), // Mo 10:00 Winterzeit
  end: new Date("2026-10-26T10:00:00Z"),
  price: 130,
  manageUrl: "https://example.de/termin/abc",
};

describe("Nachrichten-Texte", () => {
  it("Bestätigung nennt Ortszeit, Preis und den Verwaltungs-Link", () => {
    const m = confirmationEmail(appt);
    expect(m.subject).toContain("10:00");
    expect(m.text).toContain("Montag, 26. Oktober 2026");
    expect(m.text).toMatch(/130,00\s€/);
    expect(m.text).toContain(appt.manageUrl);
    expect(m.html).toContain(appt.manageUrl);
  });

  it("schützt vor eingeschleustem HTML in Namen", () => {
    const m = confirmationEmail({ ...appt, firstName: '<script>x</script>' });
    expect(m.html).not.toContain("<script>");
    expect(m.html).toContain("&lt;script&gt;");
  });

  it("SMS passt in eine Nachricht (160 Zeichen)", () => {
    expect(reminderSms(appt).length).toBeLessThanOrEqual(160);
    expect(reminderSms({ ...appt, serviceName: "x".repeat(200) }).length).toBeLessThanOrEqual(160);
  });

  it("Erinnerung, Absage, Bewertung, Nachbuchung", () => {
    expect(reminderEmail(appt).subject).toContain("morgen um 10:00");
    expect(cancellationEmail(appt, "https://example.de/book").text).toContain("https://example.de/book");
    expect(reviewRequestEmail("Maria", "https://g.page/r/x").html).toContain("https://g.page/r/x");
    const rebook = rebookEmail("Maria", "Facial", "https://example.de/book", "https://example.de/abmelden/t");
    expect(rebook.text).toContain("https://example.de/abmelden/t"); // Abmelde-Link ist Pflicht
  });
});

describe("Kalendereintrag", () => {
  it("erzeugt gültige ICS-Zeilen in UTC", () => {
    const ics = buildIcs({
      uid: "1@example.de",
      start: appt.start,
      end: appt.end,
      title: "Facial, Sense of Beauty",
      location: "Luitgardstraße 14-18, Pforzheim",
      description: "Link",
      organizer: "Sense of Beauty",
      now: new Date("2026-10-11T12:00:00Z"),
    });
    expect(ics).toContain("DTSTART:20261026T090000Z");
    expect(ics).toContain("DTEND:20261026T100000Z");
    expect(ics).toContain("SUMMARY:Facial\\, Sense of Beauty");
    expect(ics.endsWith("END:VCALENDAR\r\n")).toBe(true);
  });
});

describe("Telefonnummern", () => {
  it("bringt deutsche Nummern ins internationale Format", () => {
    expect(normalizePhone("0176 29741268")).toBe("+4917629741268");
    expect(normalizePhone("+49 176 29741268")).toBe("+4917629741268");
    expect(normalizePhone("0049 (176) 2974-1268")).toBe("+4917629741268");
    expect(normalizePhone("abc")).toBeNull();
  });
});
