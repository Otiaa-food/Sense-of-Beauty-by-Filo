-- Sense of Beauty by Filo – Sicherheit und Buchungsfunktion (Phase 2, Teil 2 von 2)
--
-- Grundregel: Der Browser (Rolle "anon") darf NUR lesen, was öffentlich sein soll
-- (aktive Behandlungen, freigegebene Stimmen, öffentliche Einstellungen).
-- Kundinnen, Termine, Zahlungen und Notizen sieht ausschließlich ein eingeloggter Admin.
-- Buchungen laufen über den Server (Secret Key), nie direkt aus dem Browser.

-- ============================================================
-- Wer ist Admin?
-- ============================================================
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.admin_users where user_id = (select auth.uid())
  );
$$;

-- ============================================================
-- Rechte: erst alles entziehen, dann gezielt vergeben.
-- (Supabase vergibt standardmäßig großzügig, das schließen wir hier ab.)
-- ============================================================
revoke all on all tables in schema public from anon, authenticated;
revoke all on all functions in schema public from public, anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;

-- auch für zukünftige Tabellen und Funktionen, die über den SQL-Editor entstehen
alter default privileges in schema public revoke all on tables from anon, authenticated;
alter default privileges in schema public revoke all on functions from public, anon, authenticated;
alter default privileges in schema public revoke all on sequences from anon, authenticated;

-- öffentlich lesbar (zusätzlich durch Policies unten eingeschränkt)
grant select on public.service_categories, public.services, public.reviews, public.settings
  to anon, authenticated;

-- eingeloggte Personen: Zugriff nur, wenn die Policies sie als Admin erkennen
grant select, insert, update, delete on
  public.admin_users,
  public.service_categories,
  public.services,
  public.customers,
  public.appointments,
  public.availability_rules,
  public.blocked_times,
  public.notifications,
  public.payments,
  public.reviews,
  public.settings
  to authenticated;

grant execute on function public.is_admin() to authenticated;

-- ============================================================
-- Row Level Security einschalten
-- ============================================================
alter table public.admin_users enable row level security;
alter table public.service_categories enable row level security;
alter table public.services enable row level security;
alter table public.customers enable row level security;
alter table public.appointments enable row level security;
alter table public.availability_rules enable row level security;
alter table public.blocked_times enable row level security;
alter table public.notifications enable row level security;
alter table public.payments enable row level security;
alter table public.reviews enable row level security;
alter table public.settings enable row level security;

-- ---------- Öffentlich lesen ----------
create policy "public_read_active_categories" on public.service_categories
  for select to anon, authenticated using (active);

create policy "public_read_active_services" on public.services
  for select to anon, authenticated using (active);

create policy "public_read_visible_reviews" on public.reviews
  for select to anon, authenticated using (visible);

create policy "public_read_public_settings" on public.settings
  for select to anon, authenticated using (is_public);

-- ---------- Admin darf alles ----------
create policy "admin_all" on public.admin_users
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin_all" on public.service_categories
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin_all" on public.services
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin_all" on public.customers
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin_all" on public.appointments
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin_all" on public.availability_rules
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin_all" on public.blocked_times
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin_all" on public.notifications
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin_all" on public.payments
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin_all" on public.reviews
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin_all" on public.settings
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ============================================================
-- Buchung anlegen (wird NUR vom Server mit dem Secret Key aufgerufen)
--
-- Der Server prüft vorher mit der Verfügbarkeitslogik (Arbeitszeiten, Vorlauf,
-- Fristen). Diese Funktion ist das Sicherheitsnetz in der Datenbank:
--   * Behandlung muss aktiv und online buchbar sein
--   * Zeitraum darf nicht gesperrt sein
--   * Zeitraum darf keinen anderen aktiven Termin überschneiden (auch bei Gleichzeitigkeit)
-- Fehlermeldungen (für den Server): service_unavailable, slot_blocked, slot_taken, invalid_status
-- ============================================================
create or replace function public.create_booking(
  p_service_id uuid,
  p_start timestamptz,
  p_first_name text,
  p_last_name text,
  p_email text,
  p_phone text default null,
  p_customer_notes text default null,
  p_marketing_consent boolean default false,
  p_status text default 'confirmed'
)
returns public.appointments
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_service public.services;
  v_customer_id uuid;
  v_end timestamptz;
  v_blocked_until timestamptz;
  v_appointment public.appointments;
begin
  if p_status not in ('pending', 'confirmed') then
    raise exception 'invalid_status';
  end if;

  select * into v_service
  from public.services
  where id = p_service_id and active and online_booking_enabled;

  if not found then
    raise exception 'service_unavailable';
  end if;

  v_end := p_start + make_interval(mins => v_service.duration_minutes);
  v_blocked_until := v_end + make_interval(mins => v_service.buffer_minutes);

  if exists (
    select 1 from public.blocked_times
    where tstzrange(start_time, end_time) && tstzrange(p_start, v_blocked_until)
  ) then
    raise exception 'slot_blocked';
  end if;

  -- Kundin über E-Mail finden oder neu anlegen. Bestehende Daten werden NICHT überschrieben
  -- (sonst könnte jemand mit fremder E-Mail die Daten einer Kundin ändern).
  insert into public.customers (first_name, last_name, email, phone, marketing_consent, marketing_consent_at)
  values (
    trim(p_first_name), trim(p_last_name), trim(p_email), nullif(trim(p_phone), ''),
    coalesce(p_marketing_consent, false),
    case when coalesce(p_marketing_consent, false) then now() end
  )
  on conflict (lower(email)) do update
    set phone = coalesce(public.customers.phone, excluded.phone),
        marketing_consent = public.customers.marketing_consent or excluded.marketing_consent,
        marketing_consent_at = coalesce(
          public.customers.marketing_consent_at,
          excluded.marketing_consent_at
        )
  returning id into v_customer_id;

  begin
    insert into public.appointments (
      customer_id, service_id, start_time, end_time, blocked_until,
      status, price, deposit_amount, customer_notes, source, hold_expires_at
    )
    values (
      v_customer_id, v_service.id, p_start, v_end, v_blocked_until,
      p_status, v_service.price,
      case when v_service.deposit_required then v_service.deposit_amount else 0 end,
      nullif(trim(p_customer_notes), ''), 'online',
      case when p_status = 'pending' then now() + interval '10 minutes' end
    )
    returning * into v_appointment;
  exception
    when exclusion_violation then
      raise exception 'slot_taken';
  end;

  return v_appointment;
end;
$$;

revoke all on function public.create_booking(uuid, timestamptz, text, text, text, text, text, boolean, text)
  from public, anon, authenticated;
grant execute on function public.create_booking(uuid, timestamptz, text, text, text, text, text, boolean, text)
  to service_role;
