-- Sense of Beauty by Filo – Admin-Bereich (Phase 5)
--
-- Telefonische Buchungen haben oft keine E-Mail-Adresse. Deshalb darf die E-Mail bei
-- Kundinnen leer sein. Die Eindeutigkeit (eine E-Mail = eine Kundin) bleibt bestehen,
-- leere Felder zählen dabei nicht.
alter table public.customers alter column email drop not null;
