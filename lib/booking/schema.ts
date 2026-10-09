import { z } from "zod";

/** Eingaben des Buchungsformulars. Wird auf dem Server geprüft (nie nur im Browser). */
export const bookingSchema = z.object({
  service: z.string().regex(/^[a-z0-9-]{1,120}$/, "Bitte wähle eine Behandlung."),
  start: z.iso.datetime({ offset: true, message: "Bitte wähle eine Uhrzeit." }),
  firstName: z.string().trim().min(1, "Bitte gib deinen Vornamen an.").max(80),
  lastName: z.string().trim().min(1, "Bitte gib deinen Nachnamen an.").max(80),
  email: z.email("Bitte prüfe deine E-Mail-Adresse.").trim().max(200),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[0-9 ()/-]{6,25}$/, "Bitte prüfe deine Telefonnummer."),
  notes: z.string().trim().max(500, "Bitte fasse dich kürzer (höchstens 500 Zeichen).").optional().default(""),
  terms: z.literal("on", { message: "Bitte bestätige die Stornierungsbedingungen und den Datenschutzhinweis." }),
  marketing: z.literal("on").optional(),
  // Spam-Schutz: unsichtbares Feld muss leer bleiben, Formular darf nicht in unter 3 Sekunden abgeschickt werden
  website: z.string().max(0).optional().default(""),
  renderedAt: z.coerce.number(),
});

export type BookingInput = z.infer<typeof bookingSchema>;

export type BookingFormState = {
  ok: false;
  message?: string;
  fieldErrors?: Partial<Record<keyof BookingInput, string>>;
  values?: Partial<Record<"firstName" | "lastName" | "email" | "phone" | "notes", string>>;
};

export function parseBooking(formData: FormData, now = Date.now()) {
  const raw = Object.fromEntries(
    ["service", "start", "firstName", "lastName", "email", "phone", "notes", "terms", "marketing", "website", "renderedAt"].map(
      (k) => [k, formData.get(k) ?? undefined],
    ),
  );
  const parsed = bookingSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: BookingFormState["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as keyof BookingInput;
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { ok: false as const, fieldErrors, spam: Boolean(fieldErrors.website) };
  }
  const tooFast = now - parsed.data.renderedAt < 3000;
  return { ok: true as const, data: parsed.data, spam: tooFast };
}
