# Sense of Beauty by Filo

Website mit eigenem Online-Buchungssystem für das Kosmetikstudio **Sense of Beauty by Filo** in Pforzheim.

Stack: Next.js, TypeScript, Tailwind CSS, Supabase, Resend, Stripe, Vercel.

## Starten

```bash
npm install
cp .env.example .env.local   # dann Werte eintragen (Supabase-Konto nötig)
npm run dev                  # http://localhost:3000
```

## Prüfen (nach jeder Phase)

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

## Aufbau

| Ordner | Inhalt |
| --- | --- |
| `app/(public)` | Öffentliche Website |
| `app/admin` | Geschützter Admin-Bereich (Login ab Phase 5) |
| `components` | Wiederverwendbare Bausteine |
| `lib/brand.config.ts` | Name, Adresse, Zeiten, Farben, Fristen des Studios |
| `lib/supabase` | Datenbank-Zugänge (Browser, Server, Admin) |
| `supabase/migrations` | Datenbank-Baupläne (Schema, Sicherheit) |
| `supabase/seed.sql` | Startdaten (erzeugt mit `npm run db:seed`) |
| `docs` | Anleitungen, z. B. `supabase-einrichten.md` |
| `tests` | Automatische Tests (inkl. echter Datenbank-Tests) |

## Für ein neues Studio

Studio-Daten in `lib/brand.config.ts` austauschen, Farben in `app/globals.css`,
eigenes Supabase-Projekt und eigene Schlüssel in `.env.local`.

## Sicherheit

- Echte Schlüssel gehören nur in `.env.local`, nie ins Repository.
- `SUPABASE_SECRET_KEY` und Stripe-Geheimnisse bleiben auf dem Server.
- Der Admin-Bereich ist für Suchmaschinen gesperrt.

## Phasen

1. Projekt-Setup (fertig)
2. Datenbank (fertig, wartet auf Einspielen in Supabase: `docs/supabase-einrichten.md`)
3. Öffentliche Website (Design nach Lumo-Vorbild, siehe docs/styleguide.md; Fotos sind Platzhalter)
4. Buchungsmotor
5. Admin
6. E-Mails
7. Stripe
8. Bewertungen
9. Planity-Import
10. Feinschliff
