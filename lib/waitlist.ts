import { z } from "zod";
import { formatLocalTime } from "@/lib/booking/availability";

/**
 * Warteliste: Kundin trägt Wunschtag und grobes Zeitfenster ein.
 * Wird in dieser Zeit etwas frei (Absage), bekommt sie eine SMS und/oder E-Mail mit Buchungslink.
 * Wer zuerst bucht, bekommt den Termin (wie bei Planity, nichts wird „reserviert").
 */

/** Zeitfenster zur Auswahl. Bewusst grob, das ist für Kundinnen am einfachsten. */
export const waitlistWindows = [
  { value: "ganztags", label: "Egal, ganzer Tag", from: "00:00", to: "23:59" },
  { value: "vormittag", label: "Vormittags (bis 12 Uhr)", from: "00:00", to: "12:00" },
  { value: "mittag", label: "Mittags (12 bis 15 Uhr)", from: "12:00", to: "15:00" },
  { value: "nachmittag", label: "Nachmittags (ab 15 Uhr)", from: "15:00", to: "23:59" },
] as const;

export type WaitlistWindow = (typeof waitlistWindows)[number]["value"];

export function windowFor(value: string) {
  return waitlistWindows.find((w) => w.value === value) ?? null;
}

/** Lesbarer Text für ein gespeichertes Zeitfenster ("13:00:00" aus der Datenbank) */
export function describeWindow(from: string, to: string): string {
  const f = from.slice(0, 5);
  const t = to.slice(0, 5);
  const known = waitlistWindows.find((w) => w.from === f && w.to === t);
  if (known) return known.label;
  return `${f} bis ${t} Uhr`;
}

/** Startzeiten, die im Wunschfenster liegen (Start zählt, nicht das Ende) */
export function slotsInWindow(slots: Date[], from: string, to: string, timezone: string): Date[] {
  const f = from.slice(0, 5);
  const t = to.slice(0, 5);
  return slots.filter((s) => {
    const hm = formatLocalTime(s, timezone);
    return hm >= f && hm < t;
  });
}

const dateKey = /^\d{4}-\d{2}-\d{2}$/;

export const waitlistSchema = z
  .object({
    service: z.string().regex(/^[a-z0-9-]{1,120}$/, "Bitte wähle eine Behandlung."),
    date: z.string().regex(dateKey, "Bitte wähle deinen Wunschtag."),
    window: z.enum(waitlistWindows.map((w) => w.value) as [WaitlistWindow, ...WaitlistWindow[]], {
      message: "Bitte wähle ein Zeitfenster.",
    }),
    firstName: z.string().trim().min(1, "Bitte gib deinen Vornamen an.").max(80),
    lastName: z.string().trim().min(1, "Bitte gib deinen Nachnamen an.").max(80),
    phone: z
      .string()
      .trim()
      .regex(/^\+?[0-9 ()/-]{6,25}$/, "Bitte prüfe deine Handynummer."),
    email: z.union([z.literal(""), z.email("Bitte prüfe deine E-Mail-Adresse.").trim().max(200)]).optional().default(""),
    consent: z.literal("on", { message: "Bitte bestätige, dass wir dich benachrichtigen dürfen." }),
    website: z.string().max(0).optional().default(""),
    renderedAt: z.coerce.number(),
  });

export type WaitlistInput = z.infer<typeof waitlistSchema>;

export type WaitlistFormState = {
  ok: boolean;
  message?: string;
  fieldErrors?: Partial<Record<keyof WaitlistInput, string>>;
};

export function parseWaitlist(formData: FormData, now = Date.now()) {
  const raw = Object.fromEntries(
    ["service", "date", "window", "firstName", "lastName", "phone", "email", "consent", "website", "renderedAt"].map((k) => [
      k,
      formData.get(k) ?? undefined,
    ]),
  );
  const parsed = waitlistSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: WaitlistFormState["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as keyof WaitlistInput;
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { ok: false as const, fieldErrors, spam: Boolean(fieldErrors.website) };
  }
  return { ok: true as const, data: parsed.data, spam: now - parsed.data.renderedAt < 3000 };
}
