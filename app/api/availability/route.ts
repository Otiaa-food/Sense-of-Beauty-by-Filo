import type { NextRequest } from "next/server";
import { formatLocalTime } from "@/lib/booking/availability";
import { availableDays, availableSlots, bookingConfigured, loadBookableService } from "@/lib/booking/server";

/**
 * Freie Termine für den Buchungsablauf.
 *   GET /api/availability?service=<slug>              → Tage mit freien Zeiten
 *   GET /api/availability?service=<slug>&day=YYYY-MM-DD → freie Uhrzeiten an dem Tag
 * Gibt nur Zeiten zurück, keine Daten anderer Kundinnen.
 */
export async function GET(request: NextRequest) {
  const headers = { "Cache-Control": "no-store" };
  const slug = request.nextUrl.searchParams.get("service") ?? "";
  const day = request.nextUrl.searchParams.get("day");

  if (!bookingConfigured()) return Response.json({ error: "not_configured" }, { status: 503, headers });
  if (!/^[a-z0-9-]{1,120}$/.test(slug)) return Response.json({ error: "bad_request" }, { status: 400, headers });
  if (day !== null && !/^\d{4}-\d{2}-\d{2}$/.test(day)) return Response.json({ error: "bad_request" }, { status: 400, headers });

  try {
    const service = await loadBookableService(slug);
    if (!service) return Response.json({ error: "service_unavailable" }, { status: 404, headers });

    if (day) {
      const { slots, timezone } = await availableSlots(service, day);
      return Response.json(
        { slots: slots.map((s) => ({ start: s.toISOString(), label: formatLocalTime(s, timezone) })) },
        { headers },
      );
    }
    const { days, firstDay } = await availableDays(service);
    return Response.json({ days, firstDay }, { headers });
  } catch (error) {
    console.error("Verfügbarkeit fehlgeschlagen:", error);
    return Response.json({ error: "server_error" }, { status: 500, headers });
  }
}
