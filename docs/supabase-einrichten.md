# Supabase einrichten (Datenbank einspielen)

Diese Anleitung ist für Nicht-Entwickler. Dauer: etwa 10 Minuten. Du brauchst nur Copy und Paste.

## Was passiert hier?

Die Datei-Ordner `supabase/migrations` enthalten die „Baupläne" der Datenbank. Du kopierst sie in den
**SQL Editor** von Supabase (ein Textfeld, in das man Befehle einfügt) und klickst auf **Run**.
Danach hat deine Datenbank alle Tabellen, die Sicherheitsregeln und Filos Behandlungen.

## Schritt 1: Skripte nacheinander ausführen

Öffne dein Projekt auf supabase.com, dann links **SQL Editor**, dann **New query**.
Füge nacheinander diese drei Dateien aus dem GitHub-Repository ein. **Die Reihenfolge ist wichtig.**

| Reihenfolge | Datei | Was sie macht |
| --- | --- | --- |
| 1 | `supabase/migrations/20261008000001_schema.sql` | Legt alle Tabellen an und die Sperre gegen Doppelbuchung |
| 2 | `supabase/migrations/20261008000002_security.sql` | Zugriffsregeln: wer darf was sehen, plus Buchungsfunktion |
| 3 | `supabase/seed.sql` | Filos Behandlungen, Arbeitszeiten und Studio-Einstellungen |

Pro Datei: Inhalt einfügen, **Run** klicken. Unten erscheint „Success. No rows returned". Das ist richtig.

Wenn eine rote Fehlermeldung kommt: nicht weitermachen, Text kopieren und mir schicken.
Jede Datei nur **einmal** ausführen (Datei 1 und 2 brechen beim zweiten Mal ab, das ist gewollt).

## Schritt 2: Öffentliche Registrierung ausschalten (wichtig)

Standardmäßig darf sich jede Person bei Supabase ein Login erstellen. Das brauchen wir nicht,
denn nur Filo (und du) sollen sich einloggen.

1. Links **Authentication**, dann **Sign In / Providers** (je nach Anzeige auch „Settings").
2. **Allow new users to sign up** ausschalten und speichern.

Auch ohne diesen Schritt bekäme eine fremde Person keine Daten zu sehen (das haben wir getestet),
aber es ist sauberer, die Tür ganz zuzumachen.

## Schritt 3: Prüfen

Links **Table Editor**. Du solltest sehen:

- `services` mit 29 Zeilen
- `service_categories` mit 3 Zeilen
- `availability_rules` mit 5 Zeilen
- `settings` mit 11 Zeilen

Bei allen Tabellen sollte „RLS enabled" angezeigt werden (kleines Schild).

## Admin-Zugang (kommt in Phase 5)

Filos Login und deiner werden erst in Phase 5 angelegt, zusammen mit dem Admin-Bereich.
Ohne Admin-Eintrag sieht niemand Kundendaten, auch nicht über die Website.

## Für Entwickler

- Startdaten stammen aus `supabase/seed/services.json`. Nach Änderungen: `npm run db:seed`.
- Datenbank-Tests laufen ohne Supabase-Konto: `npm run test` (nutzt ein eingebettetes Postgres).
- Die Verfügbarkeitslogik (freie Slots berechnen) folgt in Phase 4 im Code. Die Datenbank sichert
  zusätzlich ab, dass sich aktive Termine nie überschneiden.
