import "server-only";
import { brand } from "@/lib/brand.config";
import {
  bookableDateKeys,
  daysWithSlots,
  localDateKey,
  slotsForDay,
  type AvailabilityRule,
  type BookingSettings,
  type BusyRange,
} from "@/lib/booking/availability";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Serverseitige Buchungs-Hilfen. Nutzen den Secret Key, weil Termine und Arbeitszeiten
 * nicht öffentlich lesbar sind. Nach außen gehen nur freie Zeiten, nie Kundendaten.
 */

export type BookableService = {
  id: string;
  slug: string;
  name: string;
  duration_minutes: number;
  buffer_minutes: number;
  price: number;
};

/** Fehlt der Secret Key (z. B. noch nicht bei Vercel eingetragen), ist die Online-Buchung aus. */
export function bookingConfigured(): boolean {
  return Boolean(process.env.SUPABASE_SECRET_KEY);
}

export async function loadSettings(): Promise<BookingSettings> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("settings")
    .select("key, value")
    .in("key", ["timezone", "slot_interval_minutes", "booking_min_notice_hours", "booking_max_days_ahead"]);
  if (error) throw error;
  const map = new Map((data ?? []).map((r) => [r.key as string, r.value as unknown]));
  return {
    timezone: (map.get("timezone") as string) ?? brand.timezone,
    slotIntervalMinutes: Number(map.get("slot_interval_minutes") ?? 15),
    minNoticeHours: Number(map.get("booking_min_notice_hours") ?? brand.booking.minNoticeHours),
    maxDaysAhead: Number(map.get("booking_max_days_ahead") ?? brand.booking.maxDaysAhead),
  };
}

export async function loadBookableService(slug: string): Promise<BookableService | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("services")
    .select("id, slug, name, duration_minutes, buffer_minutes, price")
    .eq("slug", slug)
    .eq("active", true)
    .eq("online_booking_enabled", true)
    .eq("addon_only", false)
    .maybeSingle();
  if (error) throw error;
  return data ? { ...data, price: Number(data.price) } : null;
}

async function loadRules(): Promise<AvailabilityRule[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("availability_rules")
    .select("day_of_week, start_time, end_time")
    .eq("active", true);
  if (error) throw error;
  return data ?? [];
}

/** Belegte Zeiten im Zeitraum: aktive Termine (inkl. Puffer) und Sperrzeiten. Ohne Kundendaten. */
async function loadBusy(from: Date, to: Date): Promise<BusyRange[]> {
  const admin = createAdminClient();
  const [appts, blocked] = await Promise.all([
    admin
      .from("appointments")
      .select("start_time, blocked_until")
      .in("status", ["pending", "confirmed"])
      .lt("start_time", to.toISOString())
      .gt("blocked_until", from.toISOString()),
    admin
      .from("blocked_times")
      .select("start_time, end_time")
      .lt("start_time", to.toISOString())
      .gt("end_time", from.toISOString()),
  ]);
  if (appts.error) throw appts.error;
  if (blocked.error) throw blocked.error;
  return [
    ...(appts.data ?? []).map((a) => ({ start: a.start_time as string, end: a.blocked_until as string })),
    ...(blocked.data ?? []).map((b) => ({ start: b.start_time as string, end: b.end_time as string })),
  ];
}

async function context(service: BookableService, now: Date) {
  const settings = await loadSettings();
  const from = new Date(now.getTime() - 24 * 3600_000);
  const to = new Date(now.getTime() + (settings.maxDaysAhead + 2) * 24 * 3600_000);
  const [rules, busy] = await Promise.all([loadRules(), loadBusy(from, to)]);
  return {
    durationMinutes: service.duration_minutes,
    bufferMinutes: service.buffer_minutes,
    rules,
    busy,
    settings,
    now,
  };
}

export async function availableDays(service: BookableService, now = new Date()) {
  const ctx = await context(service, now);
  return { days: daysWithSlots(ctx), firstDay: bookableDateKeys(now, ctx.settings)[0], settings: ctx.settings };
}

export async function availableSlots(service: BookableService, day: string, now = new Date()) {
  const ctx = await context(service, now);
  return { slots: slotsForDay({ ...ctx, day }), timezone: ctx.settings.timezone };
}

/** Ist genau diese Startzeit noch frei? (letzte Prüfung vor dem Buchen) */
export async function isSlotFree(service: BookableService, start: Date, now = new Date()) {
  const ctx = await context(service, now);
  const day = localDateKey(start, ctx.settings.timezone);
  return slotsForDay({ ...ctx, day }).some((s) => s.getTime() === start.getTime());
}
