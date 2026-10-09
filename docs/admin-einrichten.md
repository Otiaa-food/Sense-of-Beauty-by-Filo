# Admin-Bereich einrichten (einmalig, ca. 10 Minuten)

## 1. Datenbank-Update einspielen

Supabase → SQL Editor → New query → Inhalt von `supabase/migrations/20261009000003_admin.sql` einfügen → Run.
(Erlaubt Kundinnen ohne E-Mail, z. B. bei telefonischer Buchung.)

## 2. Logins anlegen

Supabase → Authentication → Users → **Add user** → **Create new user**.
E-Mail und ein sicheres Passwort eintragen, **Auto Confirm User** anhaken, speichern.
Einmal für Filo, einmal für Benjamin. (Die Registrierung für Fremde bleibt aus.)

## 3. Logins als Admin freischalten

Ein Login allein reicht nicht. Erst der Eintrag in `admin_users` öffnet den Admin-Bereich.
SQL Editor → New query → E-Mails anpassen → Run:

```sql
insert into public.admin_users (user_id)
select id from auth.users
where lower(email) in ('filo@beispiel.de', 'benjamin@beispiel.de')
on conflict do nothing;
```

Unten muss „Success. 2 rows affected" (bzw. 1 pro Person) stehen.

## 4. Anmelden

Website-Adresse + `/admin` aufrufen, z. B. `https://senseofbeauty.de/admin`.
Am Handy: über „Teilen" → „Zum Home-Bildschirm" wie eine App ablegen.

## Zugang entziehen

```sql
delete from public.admin_users where user_id = (select id from auth.users where lower(email) = 'person@beispiel.de');
```
