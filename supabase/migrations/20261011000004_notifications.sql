-- Sense of Beauty by Filo – E-Mails und SMS (Phase 6)

-- Neue Nachrichtenarten und Kanal (E-Mail oder SMS)
alter table public.notifications drop constraint notifications_type_check;
alter table public.notifications add constraint notifications_type_check check (type in (
  'confirmation', 'cancellation', 'reschedule', 'reminder',
  'review_request', 'rebook', 'owner_new_booking', 'owner_cancellation'
));
alter table public.notifications add column channel text not null default 'email'
  check (channel in ('email', 'sms'));
alter table public.notifications drop constraint notifications_unique;
alter table public.notifications add constraint notifications_unique
  unique (appointment_id, type, channel, scheduled_at);

-- Nach wie vielen Tagen an die nächste Behandlung erinnern (leer = nie)
alter table public.services add column rebook_after_days integer
  check (rebook_after_days is null or rebook_after_days between 7 and 365);

update public.services s set rebook_after_days = case c.slug
    when 'korean-facials' then 35
    when 'laser-damen' then 42
    when 'lashes' then 42
  end
from public.service_categories c
where c.id = s.category_id and not s.addon_only;

-- Einstellungen für den Versand
insert into public.settings (key, value, is_public) values
  ('google_review_url', '"https://share.google/wrzWTSz1nPj8REkX0"'::jsonb, false),
  ('sms_reminders_enabled', 'true'::jsonb, false)
on conflict (key) do nothing;
