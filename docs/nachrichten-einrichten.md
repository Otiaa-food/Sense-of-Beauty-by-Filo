# E-Mails und SMS einrichten (Phase 6)

Was automatisch verschickt wird:

| Wann | Nachricht | An |
| --- | --- | --- |
| Online-Buchung | Bestätigung mit Kalendereintrag und Absage-Link | Kundin |
| Online-Buchung | „Neue Buchung" mit allen Daten | Filo (NOTIFY_EMAIL) |
| Kundin sagt online ab | Absage-Bestätigung / Hinweis „Zeit wieder frei" | Kundin / Filo |
| Filo trägt ein, verschiebt, sagt ab | Bestätigung, neue Zeit, Absage (abwählbar) | Kundin |
| Täglich ca. 17–18 Uhr | Erinnerung für morgen per E-Mail **und SMS** | Kundin |
| Täglich | Bewertungsanfrage (Google) nach „Erschienen", je Kundin nur einmal | Kundin |
| Täglich | „Zeit für deine nächste Behandlung?" nach X Tagen (je Behandlung im Admin), nur mit Werbe-Einwilligung | Kundin |

Ohne eingerichtete Schlüssel wird einfach nichts verschickt, die Buchung funktioniert trotzdem.

## 1. Domain

Für E-Mails an Kundinnen braucht es eine eigene Domain (z. B. bei IONOS, Strato oder INWX).
`senseofbeauty.de` ist bereits vergeben. Frei waren am 11.10.2026 z. B. `senseofbeautybyfilo.de`
und `senseofbeauty-pforzheim.de`.

## 2. Resend (E-Mail)

1. Konto auf resend.com anlegen.
2. **Domains** → **Add Domain** → Domain eintragen. Resend zeigt DNS-Einträge (TXT/MX/CNAME).
   Diese beim Domain-Anbieter eintragen, dann bei Resend **Verify**.
3. **API Keys** → **Create API Key** (Sending access) → kopieren.

## 3. seven.io (SMS, optional)

Konto auf seven.io anlegen, Guthaben aufladen, unter **Developer → API Keys** einen Schlüssel erstellen.

## 4. Bei Vercel eintragen

Projekt → Settings → Environment Variables (alle **Sensitive**, Production + Preview):

| Name | Wert |
| --- | --- |
| `RESEND_API_KEY` | Schlüssel von Resend |
| `MAIL_FROM` | `Sense of Beauty <termine@DEINE-DOMAIN>` |
| `NOTIFY_EMAIL` | Filos E-Mail-Adresse |
| `SITE_URL` | `https://DEINE-DOMAIN` |
| `SEVEN_API_KEY` | Schlüssel von seven.io (optional) |
| `CRON_SECRET` | lange Zufallsfolge, z. B. aus einem Passwort-Generator |

Danach **Redeploy**. Der tägliche Lauf ist in `vercel.json` eingetragen (15:00 UTC = 17:00 bzw. 16:00 Uhr deutscher Zeit).

## 5. Datenbank

Im SQL Editor `supabase/migrations/20261011000004_notifications.sql` ausführen.

## Neues Studio (Weiterverkauf)

Alle Dateien in `supabase/migrations` der Reihe nach ausführen, danach `supabase/seed.sql`.
