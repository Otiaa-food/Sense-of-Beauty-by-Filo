import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

/**
 * Datenbank-Tests gegen ein echtes Postgres (PGlite, läuft im Test-Prozess).
 * Die Supabase-Besonderheiten (Rollen anon/authenticated/service_role, auth.uid())
 * werden unten nachgebaut, die Migrationen laufen unverändert.
 */

const read = (path: string) => readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");

let db: PGlite;

const ADMIN_ID = "11111111-1111-4111-8111-111111111111";
const OTHER_ID = "22222222-2222-4222-8222-222222222222";

/** Führt eine Abfrage mit der Rolle aus, die Supabase beim Aufruf verwenden würde. */
async function as<T>(role: "anon" | "authenticated" | "service_role", sub: string | null, fn: () => Promise<T>) {
  await db.exec(`select set_config('request.jwt.claim.sub', '${sub ?? ""}', false); set role ${role};`);
  try {
    return await fn();
  } finally {
    await db.exec("reset role;");
  }
}

async function one<T = Record<string, unknown>>(sql: string, params: unknown[] = []) {
  const res = await db.query<T>(sql, params);
  return res.rows[0];
}

async function count(table: string) {
  const row = await one<{ n: number }>(`select count(*)::int as n from public.${table}`);
  return row.n;
}

let serviceId = ""; // Testbehandlung: 75 Min. + 15 Min. Puffer
let customerId = "";

async function insertAppointment(start: string, opts: { status?: string; durationMin?: number; bufferMin?: number } = {}) {
  const { status = "confirmed", durationMin = 75, bufferMin = 15 } = opts;
  return db.query(
    `insert into public.appointments (customer_id, service_id, start_time, end_time, blocked_until, status, price)
     values ($1, $2, $3::timestamptz,
             $3::timestamptz + make_interval(mins => $4::int),
             $3::timestamptz + make_interval(mins => $4::int + $5::int),
             $6, 89)
     returning id`,
    [customerId, serviceId, start, durationMin, bufferMin, status],
  );
}

beforeAll(async () => {
  db = new PGlite();

  // --- Supabase nachbauen ---
  await db.exec(`
    create role anon nologin;
    create role authenticated nologin;
    create role service_role nologin bypassrls;
    create schema auth;
    create table auth.users (id uuid primary key);
    create function auth.uid() returns uuid language sql stable as
      $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    grant usage on schema public, auth to anon, authenticated, service_role;
    -- Supabase vergibt standardmäßig großzügige Rechte, das bilden wir mit nach:
    alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
    alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
    alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
    grant execute on function auth.uid() to anon, authenticated, service_role;
  `);

  await db.exec(read("supabase/migrations/20261008000001_schema.sql"));
  await db.exec(read("supabase/migrations/20261008000002_security.sql"));
  await db.exec(read("supabase/migrations/20261009000003_admin.sql"));
  await db.exec(read("supabase/seed.sql"));

  await db.exec(`insert into auth.users (id) values ('${ADMIN_ID}'), ('${OTHER_ID}');`);
  await db.exec(`insert into public.admin_users (user_id) values ('${ADMIN_ID}');`);

  serviceId = (
    await one<{ id: string }>(
      `insert into public.services (name, slug, duration_minutes, buffer_minutes, price)
       values ('Test Glow Facial', 'test-glow-facial', 75, 15, 89) returning id`,
    )
  ).id;
  customerId = (
    await one<{ id: string }>(
      `insert into public.customers (first_name, last_name, email) values ('Maria', 'Müller', 'maria@example.com') returning id`,
    )
  ).id;
}, 60_000);

afterAll(async () => {
  await db.close();
});

describe("Startdaten", () => {
  it("lädt Kategorien, Behandlungen, Arbeitszeiten und Einstellungen", async () => {
    expect(await count("service_categories")).toBe(3);
    // 28 aus Filos Liste + 1 Testbehandlung
    expect(await count("services")).toBe(29);
    expect(await count("availability_rules")).toBe(5);
  });

  it("hat Filos Arbeitszeiten (Mo–Mi 10–19, Do 10–19:30, Fr 10–17)", async () => {
    const rows = (
      await db.query<{ day_of_week: number; start_time: string; end_time: string }>(
        "select day_of_week, start_time::text, end_time::text from public.availability_rules order by day_of_week",
      )
    ).rows;
    expect(rows.map((r) => [r.day_of_week, r.start_time.slice(0, 5), r.end_time.slice(0, 5)])).toEqual([
      [1, "10:00", "19:00"],
      [2, "10:00", "19:00"],
      [3, "10:00", "19:00"],
      [4, "10:00", "19:30"],
      [5, "10:00", "17:00"],
    ]);
  });

  it("schaltet Zusatzleistungen nicht online frei", async () => {
    const rows = (
      await db.query<{ name: string; online_booking_enabled: boolean }>(
        `select name, online_booking_enabled from public.services where addon_only`,
      )
    ).rows;
    expect(rows).toHaveLength(1); // Massage
    expect(rows.every((r) => r.online_booking_enabled === false)).toBe(true);
  });

  it("hat Rücken nur einmal (80 €) und 15 Minuten Pause bei allen Behandlungen", async () => {
    const rucken = (await db.query<{ price: string }>("select price::text from public.services where name = 'Rücken'")).rows;
    expect(rucken).toEqual([{ price: "80.00" }]);
    const other = await one<{ n: number }>(
      "select count(*)::int as n from public.services where buffer_minutes <> 15",
    );
    expect(other.n).toBe(0);
  });

  it("hat Filos Preise und Dauer korrekt übernommen", async () => {
    const glass = await one<{ price: string; duration_minutes: number }>(
      "select price::text, duration_minutes from public.services where slug = 'korean-glass-skin-aquafacial'",
    );
    expect(glass).toEqual({ price: "130.00", duration_minutes: 60 });
    const lash = await one<{ price: string; duration_minutes: number }>(
      "select price::text, duration_minutes from public.services where name like 'Lashlifting%'",
    );
    expect(lash).toEqual({ price: "65.00", duration_minutes: 50 });
    const ganz = await one<{ price: string; duration_minutes: number }>(
      "select price::text, duration_minutes from public.services where name = 'Damen Ganzkörper'",
    );
    expect(ganz).toEqual({ price: "190.00", duration_minutes: 85 });
  });

  it("lässt sich mehrfach laden, ohne etwas doppelt anzulegen", async () => {
    await db.exec(read("supabase/seed.sql"));
    expect(await count("services")).toBe(29);
    expect(await count("service_categories")).toBe(3);
    expect(await count("availability_rules")).toBe(5);
  });
});

describe("Schutz vor Doppelbuchung (Datenbank-Sperre)", () => {
  it("blockiert Termin plus Pufferzeit: 14:00–15:15 sperrt bis 15:30", async () => {
    await insertAppointment("2026-11-03T14:00:00+01:00");
    // 15:20 liegt noch im Puffer -> abgelehnt
    await expect(insertAppointment("2026-11-03T15:20:00+01:00")).rejects.toThrow(/exclusion/i);
    // genau 15:30 ist frei
    await expect(insertAppointment("2026-11-03T15:30:00+01:00")).resolves.toBeDefined();
  });

  it("lehnt eine direkte Überschneidung ab", async () => {
    await insertAppointment("2026-11-04T10:00:00+01:00");
    await expect(insertAppointment("2026-11-04T10:00:00+01:00")).rejects.toThrow(/exclusion/i);
    await expect(insertAppointment("2026-11-04T09:00:00+01:00")).rejects.toThrow(/exclusion/i); // endet erst nach 10:00
    await expect(insertAppointment("2026-11-04T11:00:00+01:00")).rejects.toThrow(/exclusion/i); // mitten drin
  });

  it("gibt den Slot nach einer Stornierung wieder frei", async () => {
    const res = await insertAppointment("2026-11-05T10:00:00+01:00");
    const id = res.rows[0] as { id: string };
    await db.query("update public.appointments set status = 'cancelled' where id = $1", [id.id]);
    await expect(insertAppointment("2026-11-05T10:00:00+01:00")).resolves.toBeDefined();
  });

  it("blockiert auch einen Termin, der noch auf Zahlung wartet (pending)", async () => {
    await insertAppointment("2026-11-06T10:00:00+01:00", { status: "pending" });
    await expect(insertAppointment("2026-11-06T10:30:00+01:00")).rejects.toThrow(/exclusion/i);
  });

  it("verhindert beim Verschieben eine Überschneidung", async () => {
    await insertAppointment("2026-11-09T10:00:00+01:00");
    const res = await insertAppointment("2026-11-09T14:00:00+01:00");
    const id = (res.rows[0] as { id: string }).id;
    await expect(
      db.query(
        `update public.appointments
         set start_time = '2026-11-09T10:30:00+01:00',
             end_time = '2026-11-09T11:45:00+01:00',
             blocked_until = '2026-11-09T12:00:00+01:00'
         where id = $1`,
        [id],
      ),
    ).rejects.toThrow(/exclusion/i);
  });

  it("lehnt unmögliche Zeiträume ab", async () => {
    await expect(
      db.query(
        `insert into public.appointments (customer_id, service_id, start_time, end_time, blocked_until, price)
         values ($1, $2, '2026-11-10T12:00:00Z', '2026-11-10T11:00:00Z', '2026-11-10T11:00:00Z', 89)`,
        [customerId, serviceId],
      ),
    ).rejects.toThrow(/appointments_times_valid/);
  });

  it("erzeugt für jeden Termin einen langen, einmaligen Verwaltungs-Link-Teil", async () => {
    const tokens = (await db.query<{ manage_token: string }>("select manage_token from public.appointments")).rows;
    expect(tokens.length).toBeGreaterThan(3);
    expect(new Set(tokens.map((t) => t.manage_token)).size).toBe(tokens.length);
    expect(tokens.every((t) => t.manage_token.length === 64)).toBe(true);
  });
});

describe("create_booking (Buchungsfunktion für den Server)", () => {
  const book = (start: string, email = "anna@example.com", overrides: Partial<Record<string, unknown>> = {}) =>
    as("service_role", null, () =>
      db.query(
        `select * from public.create_booking(
           $1::uuid, $2::timestamptz, $3, $4, $5, $6, $7, $8, $9)`,
        [
          overrides.service ?? serviceId,
          start,
          overrides.first ?? "Anna",
          overrides.last ?? "Beispiel",
          email,
          "0151 1234567",
          "keine Duftstoffe",
          false,
          overrides.status ?? "confirmed",
        ],
      ),
    );

  it("legt Termin mit berechnetem Ende, Puffer, Preis und Link-Teil an", async () => {
    const res = await book("2026-12-01T10:00:00+01:00");
    const row = res.rows[0] as Record<string, unknown>;
    expect(row.status).toBe("confirmed");
    expect(String(row.price)).toBe("89.00");
    expect(row.source).toBe("online");
    expect(String(row.manage_token)).toHaveLength(64);
    const times = await one<{ dur: number; blocked: number }>(
      `select extract(epoch from end_time - start_time)::int / 60 as dur,
              extract(epoch from blocked_until - end_time)::int / 60 as blocked
       from public.appointments where id = $1`,
      [row.id],
    );
    expect(times).toEqual({ dur: 75, blocked: 15 });
  });

  it("lehnt eine zweite Buchung desselben Slots ab (slot_taken)", async () => {
    await book("2026-12-02T10:00:00+01:00");
    await expect(book("2026-12-02T10:00:00+01:00", "zweite@example.com")).rejects.toThrow(/slot_taken/);
    // auch innerhalb der Pufferzeit
    await expect(book("2026-12-02T11:20:00+01:00", "dritte@example.com")).rejects.toThrow(/slot_taken/);
    // danach wieder frei
    await expect(book("2026-12-02T11:30:00+01:00", "vierte@example.com")).resolves.toBeDefined();
  });

  it("legt bei einer abgelehnten Buchung keine Kundin an", async () => {
    await book("2026-12-03T10:00:00+01:00");
    const before = await count("customers");
    await expect(book("2026-12-03T10:00:00+01:00", "niemals@example.com")).rejects.toThrow(/slot_taken/);
    expect(await count("customers")).toBe(before);
  });

  it("lehnt gesperrte Zeiten ab (slot_blocked)", async () => {
    await db.exec(
      `insert into public.blocked_times (start_time, end_time, reason)
       values ('2026-12-07T00:00:00+01:00', '2026-12-12T00:00:00+01:00', 'Urlaub')`,
    );
    await expect(book("2026-12-09T10:00:00+01:00", "urlaub@example.com")).rejects.toThrow(/slot_blocked/);
    // Termin, der vor dem Urlaub beginnt und hineinragt, ist ebenfalls gesperrt
    await expect(book("2026-12-06T23:00:00+01:00", "ragt@example.com")).rejects.toThrow(/slot_blocked/);
    // direkt nach dem Urlaub geht es wieder
    await expect(book("2026-12-12T10:00:00+01:00", "danach@example.com")).resolves.toBeDefined();
  });

  it("lehnt nicht online buchbare Behandlungen ab (service_unavailable)", async () => {
    const massage = await one<{ id: string }>("select id from public.services where addon_only");
    await expect(book("2026-12-14T10:00:00+01:00", "x@example.com", { service: massage.id })).rejects.toThrow(
      /service_unavailable/,
    );
    await expect(
      book("2026-12-14T10:00:00+01:00", "x@example.com", { service: "99999999-9999-4999-8999-999999999999" }),
    ).rejects.toThrow(/service_unavailable/);
  });

  it("lehnt ungültige Status ab", async () => {
    await expect(book("2026-12-15T10:00:00+01:00", "s@example.com", { status: "completed" })).rejects.toThrow(
      /invalid_status/,
    );
  });

  it("setzt bei 'pending' eine Reservierung, die nach 10 Minuten abläuft", async () => {
    const res = await book("2026-12-16T10:00:00+01:00", "hold@example.com", { status: "pending" });
    const row = res.rows[0] as { hold_expires_at: string | null };
    expect(row.hold_expires_at).not.toBeNull();
  });

  it("erkennt dieselbe Kundin an der E-Mail (egal ob groß/klein) und überschreibt keine Daten", async () => {
    await book("2026-12-17T10:00:00+01:00", "Lena@Example.com", { first: "Lena", last: "Original" });
    await book("2026-12-18T10:00:00+01:00", "lena@example.com", { first: "Fremde", last: "Person" });
    const rows = (
      await db.query<{ first_name: string; last_name: string }>(
        "select first_name, last_name from public.customers where lower(email) = 'lena@example.com'",
      )
    ).rows;
    expect(rows).toEqual([{ first_name: "Lena", last_name: "Original" }]);
  });

  it("rechnet Dauer bei der Umstellung auf Winterzeit richtig (25.10.2026)", async () => {
    // Die Nacht hat eine Stunde mehr. Eine 75-Minuten-Behandlung bleibt 75 Minuten lang.
    const res = await book("2026-10-25T01:30:00+02:00", "dst@example.com");
    const row = res.rows[0] as { id: string };
    const dur = await one<{ minutes: number }>(
      "select extract(epoch from end_time - start_time)::int / 60 as minutes from public.appointments where id = $1",
      [row.id],
    );
    expect(dur.minutes).toBe(75);
  });
});

describe("Zugriffsschutz (Row Level Security)", () => {
  it("zeigt Besucherinnen nur aktive Behandlungen", async () => {
    await db.exec(
      `insert into public.services (name, slug, duration_minutes, price, active)
       values ('Versteckt', 'versteckt', 30, 10, false)`,
    );
    const visible = await as("anon", null, async () => (await db.query("select slug from public.services")).rows);
    expect(visible.length).toBe(29); // 28 + Test, ohne die inaktive
    expect(visible.some((r) => (r as { slug: string }).slug === "versteckt")).toBe(false);
  });

  it("zeigt Besucherinnen nur freigegebene Stimmen", async () => {
    await db.exec(
      `insert into public.reviews (author_name, rating, text, source, visible) values
         ('Sichtbar S.', 5, 'Toll', 'manual', true),
         ('Versteckt V.', 4, 'Noch nicht freigegeben', 'planity', false)`,
    );
    const rows = await as("anon", null, async () => (await db.query<{ author_name: string }>("select author_name from public.reviews")).rows);
    expect(rows.map((r) => r.author_name)).toEqual(["Sichtbar S."]);
  });

  it("neue Stimmen sind standardmäßig nicht sichtbar", async () => {
    const row = await one<{ visible: boolean }>(
      "insert into public.reviews (author_name, rating, source) values ('Neu N.', 5, 'google') returning visible",
    );
    expect(row.visible).toBe(false);
  });

  it("zeigt Besucherinnen nur öffentliche Einstellungen", async () => {
    const keys = await as("anon", null, async () => (await db.query<{ key: string }>("select key from public.settings")).rows.map((r) => r.key));
    expect(keys).toContain("timezone");
    expect(keys).toContain("slot_interval_minutes");
    expect(keys).not.toContain("business_email");
  });

  it.each([
    "customers",
    "appointments",
    "payments",
    "notifications",
    "blocked_times",
    "availability_rules",
    "admin_users",
  ])("sperrt Besucherinnen aus bei %s", async (table) => {
    await expect(as("anon", null, () => db.query(`select * from public.${table}`))).rejects.toThrow(/permission denied/i);
  });

  it("verbietet Besucherinnen jedes Schreiben", async () => {
    await expect(
      as("anon", null, () => db.query("insert into public.reviews (author_name, rating, source, visible) values ('Fake', 5, 'manual', true)")),
    ).rejects.toThrow(/permission denied/i);
    await expect(
      as("anon", null, () => db.query("update public.services set price = 0")),
    ).rejects.toThrow(/permission denied/i);
  });

  it("verbietet Besucherinnen und eingeloggten Nicht-Admins, Buchungen direkt anzulegen", async () => {
    const args = [serviceId, "2027-01-04T10:00:00+01:00", "A", "B", "hack@example.com"];
    const sql = "select * from public.create_booking($1::uuid, $2::timestamptz, $3, $4, $5)";
    await expect(as("anon", null, () => db.query(sql, args))).rejects.toThrow(/permission denied/i);
    await expect(as("authenticated", OTHER_ID, () => db.query(sql, args))).rejects.toThrow(/permission denied/i);
  });

  it("zeigt eingeloggten Nicht-Admins keine Kundendaten und lässt sie nichts ändern", async () => {
    const rows = await as("authenticated", OTHER_ID, async () => (await db.query("select * from public.customers")).rows);
    expect(rows).toHaveLength(0);
    await expect(
      as("authenticated", OTHER_ID, () =>
        db.query("insert into public.customers (first_name, last_name, email) values ('X', 'Y', 'x@y.de')"),
      ),
    ).rejects.toThrow(/row-level security/i);
    await expect(
      as("authenticated", OTHER_ID, () => db.query("insert into public.admin_users (user_id) values ($1)", [OTHER_ID])),
    ).rejects.toThrow(/row-level security/i);
  });

  it("zeigt Admins alle Daten und lässt sie verwalten", async () => {
    const customers = await as("authenticated", ADMIN_ID, async () => (await db.query("select * from public.customers")).rows);
    expect(customers.length).toBeGreaterThan(0);

    const appts = await as("authenticated", ADMIN_ID, async () => (await db.query("select * from public.appointments")).rows);
    expect(appts.length).toBeGreaterThan(0);

    const inactive = await as("authenticated", ADMIN_ID, async () =>
      (await db.query("select slug from public.services where slug = 'versteckt'")).rows,
    );
    expect(inactive).toHaveLength(1); // Admin sieht auch inaktive Behandlungen

    await as("authenticated", ADMIN_ID, () =>
      db.query("update public.reviews set visible = true where author_name = 'Neu N.'"),
    );
    const done = await one<{ visible: boolean }>("select visible from public.reviews where author_name = 'Neu N.'");
    expect(done.visible).toBe(true);
  });
});

describe("Admin-Bereich (Phase 5)", () => {
  it("erlaubt Kundinnen ohne E-Mail (telefonische Buchung), E-Mails bleiben eindeutig", async () => {
    await db.query("insert into public.customers (first_name, last_name, phone) values ('Ohne', 'Mail', '0170 1')");
    await db.query("insert into public.customers (first_name, last_name, phone) values ('Auch', 'Ohne', '0170 2')");
    await expect(
      db.query("insert into public.customers (first_name, last_name, email) values ('X', 'Y', 'MARIA@example.com')"),
    ).rejects.toThrow();
  });

  it("lässt eingeloggte Admins Termine anlegen, aber nie überschneidend", async () => {
    const svc = await one<{ id: string }>("select id from public.services where slug = 'test-glow-facial'");
    const cust = await one<{ id: string }>("select id from public.customers where last_name = 'Mail'");
    const insert = (start: string) =>
      as("authenticated", ADMIN_ID, () =>
        db.query(
          `insert into public.appointments (customer_id, service_id, start_time, end_time, blocked_until, price, source)
           values ($1, $2, $3::timestamptz, $3::timestamptz + interval '75 minutes', $3::timestamptz + interval '90 minutes', 89, 'admin')`,
          [cust.id, svc.id, start],
        ),
      );
    await expect(insert("2027-02-01T10:00:00+01:00")).resolves.toBeDefined();
    await expect(insert("2027-02-01T11:00:00+01:00")).rejects.toThrow(/appointments_no_overlap/);
    // Fremde (nicht Admin) dürfen nichts anlegen
    await expect(
      as("authenticated", OTHER_ID, () =>
        db.query(
          `insert into public.appointments (customer_id, service_id, start_time, end_time, blocked_until, price)
           values ($1, $2, '2027-03-01T10:00:00+01:00', '2027-03-01T11:00:00+01:00', '2027-03-01T11:15:00+01:00', 1)`,
          [cust.id, svc.id],
        ),
      ),
    ).rejects.toThrow();
  });
});
