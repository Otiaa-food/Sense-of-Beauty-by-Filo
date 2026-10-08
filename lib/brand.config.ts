/**
 * Studio-Einstellungen an EINER Stelle.
 *
 * Für ein neues Studio (Weiterverkauf) werden nur die Werte in dieser Datei
 * ausgetauscht, der restliche Code bleibt gleich.
 *
 * Die Öffnungszeiten hier sind nur die Anzeige für Besucherinnen.
 * Die echten Buchungszeiten kommen später aus der Datenbank (availability_rules).
 */

export type OpeningHours = {
  /** 0 = Sonntag, 1 = Montag, … 6 = Samstag */
  dayOfWeek: number;
  label: string;
  /** null = geschlossen */
  open: string | null;
  close: string | null;
};

export const brand = {
  name: "Sense of Beauty",
  byline: "by Filo",
  fullName: "Sense of Beauty by Filo",
  tagline: "Your Korean Skincare Expert",
  domain: "senseofbeauty.de",
  siteUrl: "https://senseofbeauty.de",
  /** Platzhalter-Logo (altes Logo), wird ersetzt, sobald das neue Logo da ist. */
  logo: {
    src: "/brand/logo-placeholder.jpg",
    alt: "Sense of Beauty by Filo",
    placeholder: true,
  },
  /** Portrait von Filo (von ihr/Benjamin geliefert). Vor dem Livegang von Filo bestätigen lassen. */
  portrait: {
    src: "/brand/filo-portrait.webp",
    alt: "Filo, Inhaberin von Sense of Beauty, im schwarzen Blazer",
    width: 768,
    height: 737,
  },
  locale: "de-DE",
  language: "de",
  timezone: "Europe/Berlin",
  currency: "EUR",

  address: {
    street: "Luitgardstraße 14-18",
    detail: "2. OG",
    zip: "75177",
    city: "Pforzheim",
  },

  /** E-Mail kommt später (leer = wird auf der Website nicht angezeigt). */
  contact: {
    email: "",
    phone: "+49 176 29741268",
    instagram: "https://www.instagram.com/senseofbeauty.byfilo/",
    instagramHandle: "@senseofbeauty.byfilo",
    googleBusinessUrl: "https://share.google/wrzWTSz1nPj8REkX0",
  },

  /** Bestehende Buchungsregeln aus dem Interview (später in den Admin-Einstellungen änderbar). */
  booking: {
    maxDaysAhead: 60,
    minNoticeHours: 12,
    freeCancellationHours: 24,
  },

  /** Farben stehen als CSS-Variablen in app/globals.css. Hier nur zur Dokumentation. */
  colors: {
    cream: "#F6EFE6",
    sand: "#E9DBC8",
    caramel: "#B58863",
    cocoa: "#5E4130",
    ink: "#2B2018",
  },
} as const;

export const openingHours: readonly OpeningHours[] = [
  { dayOfWeek: 1, label: "Montag", open: "10:00", close: "19:00" },
  { dayOfWeek: 2, label: "Dienstag", open: "10:00", close: "19:00" },
  { dayOfWeek: 3, label: "Mittwoch", open: "10:00", close: "19:00" },
  { dayOfWeek: 4, label: "Donnerstag", open: "10:00", close: "19:30" },
  { dayOfWeek: 5, label: "Freitag", open: "10:00", close: "17:00" },
  { dayOfWeek: 6, label: "Samstag", open: null, close: null },
  { dayOfWeek: 0, label: "Sonntag", open: null, close: null },
] as const;

export function formatAddress(): string {
  const { street, detail, zip, city } = brand.address;
  return `${street}, ${detail}, ${zip} ${city}`;
}

export function mapsDirectionsUrl(): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${brand.fullName}, ${formatAddress()}`,
  )}`;
}
