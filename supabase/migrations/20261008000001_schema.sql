-- Sense of Beauty by Filo – Datenbank-Schema (Phase 2, Teil 1 von 2)
--
-- Zeiten: Termine und Sperrzeiten sind timestamptz (intern UTC, korrekt bei Sommer-/Winterzeit).
-- Arbeitszeiten (availability_rules) sind dagegen lokale Uhrzeiten ("10:00") und werden
-- im Code mit der Zeitzone aus settings ("Europe/Berlin") in echte Zeitpunkte umgerechnet.
--
-- Hinweis für später (mehrere Behandlerinnen): appointments bekommt dann eine staff_id,
-- und die Sperre gegen Doppelbuchung gilt pro staff_id (dafür wird die Erweiterung btree_gist nötig).

-- ============================================================
-- Hilfsfunktion: updated_at automatisch pflegen
-- ============================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================================
-- Admin-Konten: wer im Admin-Bereich arbeiten darf
-- (Login selbst macht Supabase Auth, hier steht nur die Berechtigung)
-- ============================================================
create table public.admin_users (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

-- ============================================================
-- Behandlungen
-- ============================================================
create table public.service_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.services (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.service_categories (id) on delete set null,
  name text not null,
  slug text not null unique,
  description text,
  duration_minutes integer not null check (duration_minutes > 0),
  buffer_minutes integer not null default 0 check (buffer_minutes >= 0),
  price numeric(10, 2) not null check (price >= 0),
  deposit_required boolean not null default false,
  deposit_amount numeric(10, 2) not null default 0 check (deposit_amount >= 0),
  online_booking_enabled boolean not null default true,
  -- true = nur zusätzlich zu einer anderen Behandlung buchbar (z. B. Massage zum Facial)
  addon_only boolean not null default false,
  active boolean not null default true,
  image_url text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint services_deposit_not_above_price check (deposit_amount <= price),
  constraint services_deposit_consistent check (not deposit_required or deposit_amount > 0)
);

create index services_category_idx on public.services (category_id, sort_order);

-- ============================================================
-- Kundinnen
-- ============================================================
create table public.customers (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text not null,
  email text not null,
  phone text,
  marketing_consent boolean not null default false,
  marketing_consent_at timestamptz,
  -- Interne Notizen. Können sensibel sein: nur Admin darf sie lesen (siehe Row Level Security).
  notes text,
  -- Gesetzt, wenn die Person nach DSGVO-Löschwunsch anonymisiert wurde
  anonymized_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Eine E-Mail-Adresse = eine Kundin (Groß-/Kleinschreibung egal)
create unique index customers_email_key on public.customers (lower(email));
create index customers_phone_idx on public.customers (phone);
create index customers_name_idx on public.customers (lower(last_name), lower(first_name));

-- ============================================================
-- Termine
-- ============================================================
create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers (id) on delete restrict,
  service_id uuid not null references public.services (id) on delete restrict,

  -- start_time bis end_time = Behandlung. blocked_until = end_time + Pufferzeit.
  -- Beispiel: 14:00 bis 15:15 Behandlung, 15 Min. Puffer -> blocked_until 15:30.
  start_time timestamptz not null,
  end_time timestamptz not null,
  blocked_until timestamptz not null,

  status text not null default 'confirmed'
    check (status in ('pending', 'confirmed', 'completed', 'cancelled', 'no_show')),
  payment_status text not null default 'unpaid'
    check (payment_status in ('unpaid', 'pending', 'paid', 'failed', 'refunded')),

  -- Preis und Anzahlung werden beim Buchen festgehalten (spätere Preisänderungen ändern alte Termine nicht)
  price numeric(10, 2) not null check (price >= 0),
  deposit_amount numeric(10, 2) not null default 0 check (deposit_amount >= 0),

  customer_notes text,
  internal_notes text,

  -- Geheimer Link-Teil, mit dem Kundinnen ihren Termin selbst stornieren können.
  -- Lang und zufällig, nicht erratbar.
  manage_token text not null unique
    default replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''),

  -- Nur für Termine, die auf eine Zahlung warten (Stripe, später): Reservierung läuft dann ab
  hold_expires_at timestamptz,

  cancelled_at timestamptz,
  cancel_reason text,
  source text not null default 'online' check (source in ('online', 'admin', 'import')),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint appointments_times_valid check (end_time > start_time and blocked_until >= end_time),

  -- DAS ist der Schutz gegen Doppelbuchung, direkt in der Datenbank:
  -- Zwei aktive Termine (wartend oder bestätigt) dürfen sich nie zeitlich überschneiden,
  -- Pufferzeit eingerechnet. Bei gleichzeitigen Buchungen gewinnt genau eine.
  constraint appointments_no_overlap
    exclude using gist (tstzrange(start_time, blocked_until) with &&)
    where (status in ('pending', 'confirmed'))
);

create index appointments_start_idx on public.appointments (start_time);
create index appointments_customer_idx on public.appointments (customer_id, start_time desc);
create index appointments_status_idx on public.appointments (status, start_time);

-- ============================================================
-- Arbeitszeiten (lokale Uhrzeit, Wochentag 0 = Sonntag ... 6 = Samstag)
-- Mehrere Zeilen pro Tag sind möglich: zwei Zeitfenster = Mittagspause dazwischen.
-- ============================================================
create table public.availability_rules (
  id uuid primary key default gen_random_uuid(),
  day_of_week smallint not null check (day_of_week between 0 and 6),
  start_time time not null,
  end_time time not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint availability_rules_time_valid check (end_time > start_time)
);

create index availability_rules_day_idx on public.availability_rules (day_of_week);

-- ============================================================
-- Gesperrte Zeiten (Urlaub, Fortbildung, private Termine …)
-- ============================================================
create table public.blocked_times (
  id uuid primary key default gen_random_uuid(),
  start_time timestamptz not null,
  end_time timestamptz not null,
  reason text,
  created_at timestamptz not null default now(),
  constraint blocked_times_time_valid check (end_time > start_time)
);

create index blocked_times_range_idx on public.blocked_times using gist (tstzrange(start_time, end_time));

-- ============================================================
-- E-Mail-Benachrichtigungen (verhindert doppelte Erinnerungen)
-- ============================================================
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.appointments (id) on delete cascade,
  type text not null check (type in ('confirmation', 'cancellation', 'reschedule', 'reminder')),
  scheduled_at timestamptz not null,
  sent_at timestamptz,
  status text not null default 'pending' check (status in ('pending', 'sent', 'failed', 'skipped')),
  error_message text,
  created_at timestamptz not null default now(),
  -- dieselbe Nachricht zur selben Zeit kann nur einmal existieren
  constraint notifications_unique unique (appointment_id, type, scheduled_at)
);

create index notifications_due_idx on public.notifications (status, scheduled_at);

-- ============================================================
-- Zahlungen (Stripe, ab Phase 7). Es werden keine Kartendaten gespeichert.
-- ============================================================
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.appointments (id) on delete restrict,
  stripe_payment_intent_id text unique,
  amount numeric(10, 2) not null check (amount >= 0),
  currency text not null default 'eur',
  status text not null default 'pending' check (status in ('pending', 'paid', 'failed', 'refunded')),
  payment_type text not null check (payment_type in ('deposit', 'full_payment', 'refund')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index payments_appointment_idx on public.payments (appointment_id);

-- ============================================================
-- Kundenstimmen. Neu angelegte Stimmen sind standardmäßig NICHT sichtbar,
-- bis Filo sie freigibt (nur echte, erlaubte Bewertungen).
-- ============================================================
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  author_name text not null,
  rating smallint not null check (rating between 1 and 5),
  text text,
  source text not null check (source in ('planity', 'google', 'manual')),
  source_url text,
  review_date date,
  visible boolean not null default false,
  created_at timestamptz not null default now()
);

create index reviews_visible_idx on public.reviews (visible, review_date desc);

-- ============================================================
-- Einstellungen (Schlüssel/Wert). is_public = darf die Website lesen.
-- ============================================================
create table public.settings (
  key text primary key,
  value jsonb not null,
  is_public boolean not null default false,
  updated_at timestamptz not null default now()
);

-- ============================================================
-- updated_at automatisch pflegen
-- ============================================================
create trigger set_updated_at before update on public.service_categories
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.services
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.customers
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.appointments
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.availability_rules
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.payments
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.settings
  for each row execute function public.set_updated_at();
