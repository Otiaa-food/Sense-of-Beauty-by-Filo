-- Sense of Beauty by Filo – Warteliste und Geburtstags-Kampagne

-- Geburtstag freiwillig, nur Tag und Monat (kein Jahr = kein Alter gespeichert)
alter table public.customers add column birthday_day smallint check (birthday_day between 1 and 31);
alter table public.customers add column birthday_month smallint check (birthday_month between 1 and 12);
alter table public.customers add constraint customers_birthday_complete
  check ((birthday_day is null) = (birthday_month is null));

-- Eigener Abmelde-Link je Kundin (für Geburtstagsgrüße und Rundnachrichten, auch ohne Termin)
alter table public.customers add column unsubscribe_token text not null unique
  default replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '');

-- Warteliste: Wunschtag und grobes Zeitfenster für eine Behandlung
create table public.waitlist (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references public.services (id) on delete cascade,
  desired_date date not null,
  time_from time not null default '00:00',
  time_to time not null default '23:59',
  first_name text not null,
  last_name text not null,
  email text,
  phone text,
  status text not null default 'waiting' check (status in ('waiting', 'notified', 'booked', 'expired', 'removed')),
  notified_at timestamptz,
  created_at timestamptz not null default now(),
  constraint waitlist_contact check (email is not null or phone is not null),
  constraint waitlist_window check (time_to > time_from)
);
create index waitlist_date_idx on public.waitlist (desired_date, status);

alter table public.waitlist enable row level security;
grant select, insert, update, delete on public.waitlist to authenticated;
create policy "admin_all" on public.waitlist
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Rundnachrichten (E-Mail oder SMS an alle Kundinnen mit Werbe-Einwilligung)
create table public.campaigns (
  id uuid primary key default gen_random_uuid(),
  channel text not null check (channel in ('email', 'sms')),
  subject text,
  body text not null check (char_length(body) between 1 and 5000),
  recipients integer not null default 0,
  sent_count integer not null default 0,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  constraint campaigns_email_subject check (channel = 'sms' or subject is not null)
);
alter table public.campaigns enable row level security;
grant select, insert, update, delete on public.campaigns to authenticated;
create policy "admin_all" on public.campaigns
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Protokoll für Nachrichten, die nicht an einem Termin hängen (Warteliste, Geburtstag).
-- dedupe_key verhindert doppelten Versand (z. B. "birthday:<kundin>:2027:email").
create table public.message_log (
  id uuid primary key default gen_random_uuid(),
  dedupe_key text not null unique,
  type text not null check (type in ('waitlist_offer', 'birthday', 'campaign')),
  channel text not null check (channel in ('email', 'sms')),
  customer_id uuid references public.customers (id) on delete set null,
  waitlist_id uuid references public.waitlist (id) on delete set null,
  campaign_id uuid references public.campaigns (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'sent', 'failed', 'skipped')),
  error_message text,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.message_log enable row level security;
grant select on public.message_log to authenticated;
create policy "admin_read" on public.message_log
  for select to authenticated using (public.is_admin());

-- Einstellungen der Geburtstags-Kampagne (im Admin änderbar, standardmäßig aus)
insert into public.settings (key, value, is_public) values
  ('birthday_campaign', '{"enabled": false, "channel": "email", "gift": "10 % Rabatt auf deine nächste Behandlung", "code": "", "validDays": 30}'::jsonb, false)
on conflict (key) do nothing;
