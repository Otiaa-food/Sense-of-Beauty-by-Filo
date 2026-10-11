import type { NextRequest } from "next/server";
import { runDailyJobs } from "@/lib/notify/dispatch";

/**
 * Täglicher Lauf (Vercel Cron, siehe vercel.json): Erinnerungen für morgen,
 * Bewertungsanfragen und Nachbuchungs-Erinnerungen.
 * Vercel schickt dabei automatisch "Authorization: Bearer <CRON_SECRET>".
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  try {
    const summary = await runDailyJobs(new Date());
    return Response.json({ ok: true, ...summary }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Täglicher Lauf fehlgeschlagen:", error);
    return Response.json({ ok: false }, { status: 500 });
  }
}
