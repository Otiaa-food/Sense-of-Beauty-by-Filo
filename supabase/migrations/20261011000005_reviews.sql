-- Sense of Beauty by Filo – Bewertungen (Phase 8)
--
-- Regel: Ein Zitat erscheint nur auf der Website, wenn die Kundin zugestimmt hat.
-- Das gilt für alle Quellen (Google, Planity, persönlich).
alter table public.reviews add column consent_confirmed_at timestamptz;
alter table public.reviews add column updated_at timestamptz not null default now();
alter table public.reviews add constraint reviews_visible_needs_consent
  check (not visible or consent_confirmed_at is not null);

create trigger set_updated_at before update on public.reviews
  for each row execute function public.set_updated_at();

-- Übersicht (Sterneschnitt und Anzahl) für die Website, im Admin gepflegt
insert into public.settings (key, value, is_public) values
  ('review_summary', '{"google": {"rating": null, "count": null}, "planity": {"rating": null, "count": null, "url": ""}}'::jsonb, true)
on conflict (key) do nothing;
