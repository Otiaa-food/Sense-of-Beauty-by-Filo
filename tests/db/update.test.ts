import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
import { expect, it } from "vitest";

// Beweist, dass das Update-Skript die schon befüllte Datenbank (alter Stand) auf den neuen Stand bringt.
const read = (p: string) => readFileSync(new URL(`../../${p}`, import.meta.url), "utf8");

it("bringt die alte Datenbank mit dem Update-Skript auf den Stand der neuen Startdaten", async () => {
  const db = new PGlite();
  await db.exec("create schema auth; create table auth.users (id uuid primary key);");
  await db.exec(read("supabase/migrations/20261008000001_schema.sql"));
  await db.exec(readFileSync(new URL("./seed-before-update.sql", import.meta.url), "utf8"));
  await db.exec(read("supabase/updates/20261008_kontakt_puffer_ruecken.sql"));

  const fresh = new PGlite();
  await fresh.exec("create schema auth; create table auth.users (id uuid primary key);");
  await fresh.exec(read("supabase/migrations/20261008000001_schema.sql"));
  await fresh.exec(read("supabase/seed.sql"));

  const q = `select slug, price::text, buffer_minutes, online_booking_enabled, sort_order from public.services order by slug`;
  expect((await db.query(q)).rows).toEqual((await fresh.query(q)).rows);
  const s = `select key, value from public.settings order by key`;
  expect((await db.query(s)).rows).toEqual((await fresh.query(s)).rows);
}, 60_000);
