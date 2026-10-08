// Erzeugt supabase/seed.sql aus supabase/seed/services.json.
// Aufruf: npm run db:seed
//
// Das Ergebnis (supabase/seed.sql) wird im Supabase SQL-Editor eingefügt, NACH den beiden Migrationen.
// Bitte nur in eine leere Datenbank laden. Mehrfaches Ausführen legt nichts doppelt an.

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const root = new URL("../", import.meta.url);
const data = JSON.parse(readFileSync(new URL("supabase/seed/services.json", root), "utf8"));

const q = (value) => (value === null || value === undefined || value === "" ? "null" : `'${String(value).replaceAll("'", "''")}'`);

function slugify(text) {
  return text
    .toLowerCase()
    .replaceAll("ä", "ae")
    .replaceAll("ö", "oe")
    .replaceAll("ü", "ue")
    .replaceAll("ß", "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 110)
    .replace(/-+$/g, "");
}

const used = new Map();
function uniqueSlug(name) {
  const base = slugify(name);
  const n = (used.get(base) ?? 0) + 1;
  used.set(base, n);
  return n === 1 ? base : `${base}-${n}`;
}

const lines = [];
lines.push("-- Sense of Beauty by Filo – Startdaten");
lines.push("-- AUTOMATISCH ERZEUGT aus supabase/seed/services.json (npm run db:seed). Nicht von Hand ändern.");
lines.push("");

// ---------- Kategorien ----------
lines.push("insert into public.service_categories (slug, name, description, sort_order) values");
lines.push(
  data.categories
    .map((c) => `  (${q(c.slug)}, ${q(c.name)}, ${q(c.description)}, ${c.sort_order})`)
    .join(",\n"),
);
lines.push("on conflict (slug) do nothing;");
lines.push("");

// ---------- Behandlungen ----------
// Online noch NICHT buchbar: Zusatzleistungen (Mehrfachbuchung folgt später)
// und Einträge, die Filo erst klären muss.
const rows = data.services.map((s, i) => {
  const slug = uniqueSlug(s.name);
  const online = !(s.addon_only || s.needs_clarification);
  return (
    `  (${q(s.category)}, ${q(s.name)}, ${q(slug)}, ${q(s.description)}, ${s.duration_minutes}, ` +
    `${s.buffer_minutes ?? 0}, ${Number(s.price).toFixed(2)}, ${online}, ${s.addon_only ? "true" : "false"}, ${i + 1})`
  );
});

lines.push(
  "insert into public.services",
  "  (category_id, name, slug, description, duration_minutes, buffer_minutes, price, online_booking_enabled, addon_only, sort_order)",
  "select c.id, v.name, v.slug, v.description, v.duration_minutes, v.buffer_minutes, v.price, v.online_booking_enabled, v.addon_only, v.sort_order",
  "from (values",
  rows.join(",\n"),
  ") as v (category_slug, name, slug, description, duration_minutes, buffer_minutes, price, online_booking_enabled, addon_only, sort_order)",
  "join public.service_categories c on c.slug = v.category_slug",
  "on conflict (slug) do nothing;",
  "",
);

// ---------- Arbeitszeiten (Anzeige von Filo, bitte von ihr bestätigen lassen) ----------
lines.push(
  "-- Arbeitszeiten laut Filo (0 = Sonntag). Samstag und Sonntag geschlossen.",
  "-- Eine Mittagspause ist nicht bekannt. Sie wird später im Admin als zwei Zeitfenster eingetragen.",
  "insert into public.availability_rules (day_of_week, start_time, end_time)",
  "select * from (values",
  "  (1::smallint, '10:00'::time, '19:00'::time),",
  "  (2::smallint, '10:00'::time, '19:00'::time),",
  "  (3::smallint, '10:00'::time, '19:00'::time),",
  "  (4::smallint, '10:00'::time, '19:30'::time),",
  "  (5::smallint, '10:00'::time, '17:00'::time)",
  ") as v (day_of_week, start_time, end_time)",
  "where not exists (select 1 from public.availability_rules);",
  "",
);

// ---------- Einstellungen ----------
const settings = [
  ["business_name", "Sense of Beauty by Filo", true],
  ["business_tagline", "Your Korean Skincare Expert", true],
  ["business_email", "", false],
  ["business_phone", "+49 176 29741268", true],
  ["address", { street: "Luitgardstraße 14-18", detail: "2. OG", zip: "75177", city: "Pforzheim" }, true],
  ["timezone", "Europe/Berlin", true],
  ["currency", "EUR", true],
  ["slot_interval_minutes", 15, true],
  ["booking_min_notice_hours", 12, true],
  ["booking_max_days_ahead", 60, true],
  ["cancellation_hours", 24, true],
];

lines.push(
  "insert into public.settings (key, value, is_public) values",
  settings.map(([k, v, pub]) => `  (${q(k)}, ${q(JSON.stringify(v))}::jsonb, ${pub})`).join(",\n"),
  "on conflict (key) do nothing;",
  "",
);

const out = fileURLToPath(new URL("supabase/seed.sql", root));
writeFileSync(out, lines.join("\n"));
console.log(`seed.sql geschrieben: ${data.categories.length} Kategorien, ${data.services.length} Behandlungen`);
