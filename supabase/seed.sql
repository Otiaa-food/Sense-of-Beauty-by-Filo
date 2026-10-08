-- Sense of Beauty by Filo – Startdaten
-- AUTOMATISCH ERZEUGT aus supabase/seed/services.json (npm run db:seed). Nicht von Hand ändern.

insert into public.service_categories (slug, name, description, sort_order) values
  ('korean-facials', 'Korean Facials', 'Authentische Wirkstoffkosmetik aus den Hautkliniken Seouls. Die Behandlung wird individuell auf deinen Hautzustand abgestimmt und arbeitet mit hochkonzentrierten Ampullen für sichtbare, nachhaltige Ergebnisse. Vor Ort führt Filo zunächst eine Hautanalyse durch und empfiehlt danach die passende Behandlung.', 1),
  ('laser-damen', 'Laserbehandlungen Damen', '3 Wellenlängen Ice Laser (Alexandrit + Dioden + YAG).', 2),
  ('lashes', 'Lashes', null, 3)
on conflict (slug) do nothing;

insert into public.services
  (category_id, name, slug, description, duration_minutes, buffer_minutes, price, online_booking_enabled, addon_only, sort_order)
select c.id, v.name, v.slug, v.description, v.duration_minutes, v.buffer_minutes, v.price, v.online_booking_enabled, v.addon_only, v.sort_order
from (values
  ('korean-facials', 'Korean Glass Skin Aquafacial', 'korean-glass-skin-aquafacial', null, 60, 0, 130.00, true, false, 1),
  ('korean-facials', 'Korean Double Glow Treatment – Aquafacial & Electro Light Impulse inkl. Cica Exo', 'korean-double-glow-treatment-aquafacial-electro-light-impulse-inkl-cica-exo', null, 80, 0, 140.00, true, false, 2),
  ('korean-facials', 'Korean Double Glow Treatment – Aquafacial & Electro Light Impulse inkl. Salmon DNA', 'korean-double-glow-treatment-aquafacial-electro-light-impulse-inkl-salmon-dna', null, 80, 0, 160.00, true, false, 3),
  ('korean-facials', 'Korean Glow Microneedling Cica Aqua Exo', 'korean-glow-microneedling-cica-aqua-exo', null, 80, 0, 130.00, true, false, 4),
  ('korean-facials', 'Korean Glow Microneedling Salmon DNA', 'korean-glow-microneedling-salmon-dna', null, 80, 0, 140.00, true, false, 5),
  ('korean-facials', 'Korean Glow Microneedling PDX5', 'korean-glow-microneedling-pdx5', null, 80, 0, 150.00, true, false, 6),
  ('korean-facials', 'Korean Triple Glow Treatment – Aquafacial + Microneedling & Electro Light Impulse mit Cica Aqua Exo', 'korean-triple-glow-treatment-aquafacial-microneedling-electro-light-impulse-mit-cica-aqua-exo', null, 90, 0, 170.00, true, false, 7),
  ('korean-facials', 'Korean Triple Glow Treatment – Aquafacial + Microneedling & Electro Light Impulse mit Salmon DNA', 'korean-triple-glow-treatment-aquafacial-microneedling-electro-light-impulse-mit-salmon-dna', null, 90, 0, 190.00, true, false, 8),
  ('korean-facials', 'Korean Triple Glow Treatment – Aquafacial + Microneedling & Electro Light Impulse mit PDX5', 'korean-triple-glow-treatment-aquafacial-microneedling-electro-light-impulse-mit-pdx5', null, 90, 0, 210.00, true, false, 9),
  ('korean-facials', 'Dekolleté-, Schulter- & Nackenmassage', 'dekollet-schulter-nackenmassage', 'Nur zusätzlich zu einem Facial buchbar.', 20, 0, 25.00, false, true, 10),
  ('laser-damen', 'Damen Ganzkörper', 'damen-ganzkoerper', null, 85, 0, 190.00, true, false, 11),
  ('laser-damen', 'Gesicht', 'gesicht', null, 20, 0, 50.00, true, false, 12),
  ('laser-damen', 'Kinn', 'kinn', null, 15, 0, 25.00, true, false, 13),
  ('laser-damen', 'Wangen', 'wangen', null, 15, 0, 25.00, true, false, 14),
  ('laser-damen', 'Oberlippe', 'oberlippe', null, 15, 0, 25.00, true, false, 15),
  ('laser-damen', 'Hals', 'hals', null, 15, 0, 25.00, true, false, 16),
  ('laser-damen', 'Achseln', 'achseln', null, 15, 0, 45.00, true, false, 17),
  ('laser-damen', 'Oberarme', 'oberarme', null, 25, 0, 45.00, true, false, 18),
  ('laser-damen', 'Unterarme', 'unterarme', null, 25, 0, 45.00, true, false, 19),
  ('laser-damen', 'Arme komplett', 'arme-komplett', null, 30, 0, 90.00, true, false, 20),
  ('laser-damen', 'Rücken', 'ruecken', null, 30, 0, 90.00, false, false, 21),
  ('laser-damen', 'Rücken', 'ruecken-2', null, 30, 0, 80.00, false, false, 22),
  ('laser-damen', 'Bauch', 'bauch', null, 30, 0, 45.00, true, false, 23),
  ('laser-damen', 'Oberschenkel', 'oberschenkel', null, 30, 0, 55.00, true, false, 24),
  ('laser-damen', 'Unterschenkel', 'unterschenkel', null, 30, 0, 55.00, true, false, 25),
  ('laser-damen', 'Beine komplett', 'beine-komplett', null, 45, 0, 110.00, true, false, 26),
  ('laser-damen', 'Intim/Bikini', 'intim-bikini', null, 20, 0, 55.00, true, false, 27),
  ('laser-damen', 'Po + Po-Falte', 'po-po-falte', null, 20, 0, 45.00, true, false, 28),
  ('lashes', 'Lashlifting inkl. Färben + Botolami Intensivkur', 'lashlifting-inkl-faerben-botolami-intensivkur', null, 50, 0, 65.00, true, false, 29)
) as v (category_slug, name, slug, description, duration_minutes, buffer_minutes, price, online_booking_enabled, addon_only, sort_order)
join public.service_categories c on c.slug = v.category_slug
on conflict (slug) do nothing;

-- Arbeitszeiten laut Filo (0 = Sonntag). Samstag und Sonntag geschlossen.
-- Eine Mittagspause ist nicht bekannt. Sie wird später im Admin als zwei Zeitfenster eingetragen.
insert into public.availability_rules (day_of_week, start_time, end_time)
select * from (values
  (1::smallint, '10:00'::time, '19:00'::time),
  (2::smallint, '10:00'::time, '19:00'::time),
  (3::smallint, '10:00'::time, '19:00'::time),
  (4::smallint, '10:00'::time, '19:30'::time),
  (5::smallint, '10:00'::time, '17:00'::time)
) as v (day_of_week, start_time, end_time)
where not exists (select 1 from public.availability_rules);

insert into public.settings (key, value, is_public) values
  ('business_name', '"Sense of Beauty by Filo"'::jsonb, true),
  ('business_tagline', '"Your Korean Skincare Expert"'::jsonb, true),
  ('business_email', '""'::jsonb, false),
  ('business_phone', '""'::jsonb, true),
  ('address', '{"street":"Luitgardstraße 14-18","detail":"2. OG","zip":"75177","city":"Pforzheim"}'::jsonb, true),
  ('timezone', '"Europe/Berlin"'::jsonb, true),
  ('currency', '"EUR"'::jsonb, true),
  ('slot_interval_minutes', '15'::jsonb, true),
  ('booking_min_notice_hours', '12'::jsonb, true),
  ('booking_max_days_ahead', '60'::jsonb, true),
  ('cancellation_hours', '24'::jsonb, true)
on conflict (key) do nothing;
