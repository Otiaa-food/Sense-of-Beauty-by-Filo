-- Sense of Beauty by Filo – Update für die bereits befüllte Datenbank (08.10.2026)
--
-- Was ändert sich?
--   1. "Rücken" gab es doppelt (90 € und 80 €). Filo: richtig ist 80 €. Der 90-€-Eintrag wird gelöscht,
--      der 80-€-Eintrag wird online buchbar.
--   2. Alle Behandlungen bekommen 15 Minuten Pause nach dem Termin.
--   3. Telefonnummer des Studios wird hinterlegt.
-- Nur EINMAL ausführen. Es gibt noch keine Termine, deshalb ist das gefahrlos.

delete from public.services where slug = 'ruecken' and price = 90;

update public.services
  set slug = 'ruecken', online_booking_enabled = true
  where slug = 'ruecken-2' and price = 80;

-- Reihenfolge lückenlos halten (alles hinter Rücken rückt um eins auf)
update public.services set sort_order = sort_order - 1 where sort_order > 21;

update public.services set buffer_minutes = 15;

update public.settings set value = '"+49 176 29741268"'::jsonb where key = 'business_phone';
