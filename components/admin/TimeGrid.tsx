import Link from "next/link";
import { placeOnDay } from "@/lib/admin/calendar";
import { fmtDayKey, fmtTime, statusLabels } from "@/lib/admin/format";

/**
 * Zeitraster wie in einem Kalender-Programm: Spalten = Tage, Zeilen = Stunden.
 * Termine sind Blöcke in ihrer echten Länge, Sperrzeiten schraffiert, Zeiten außerhalb der Arbeitszeit grau.
 */

export type GridEvent = {
  id: string;
  start: string;
  end: string;
  status: string;
  title: string;
  subtitle?: string;
  meta?: string;
  online?: boolean;
};
export type GridBlock = { id: string; start: string; end: string; reason: string | null };
export type GridHours = { day: string; windows: { from: string; to: string }[] };

const HOUR = 64; // Pixel pro Stunde

const tone: Record<string, string> = {
  confirmed: "border-cocoa bg-blush text-espresso hover:bg-[#ead6c2]",
  pending: "border-caramel bg-[#f7ecdf] text-espresso",
  completed: "border-[#2f7f72] bg-[#e3efe9] text-[#1f4740] hover:bg-[#d5e8df]",
  no_show: "border-[#a4512c] bg-[#f4dfd6] text-[#5e2a13]",
};

const toMin = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};

export function TimeGrid({
  days,
  events,
  blocks,
  hours,
  fromHour,
  toHour,
  today,
  now,
  tz,
  dayHref,
  detailed = false,
}: {
  days: string[];
  events: GridEvent[];
  blocks: GridBlock[];
  hours: GridHours[];
  fromHour: number;
  toHour: number;
  today: string;
  now: { date: string; time: string };
  tz: string;
  dayHref: (day: string) => string;
  detailed?: boolean;
}) {
  const totalMin = (toHour - fromHour) * 60;
  const height = (toHour - fromHour) * HOUR;
  const px = (min: number) => (min / 60) * HOUR;
  const labels = Array.from({ length: toHour - fromHour }, (_, i) => fromHour + i);

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <div className={detailed ? "min-w-[22rem]" : "min-w-[38rem]"}>
          {/* Kopfzeile mit Tagen */}
          <div className="grid border-b border-card-line" style={{ gridTemplateColumns: `3.5rem repeat(${days.length}, minmax(0, 1fr))` }}>
            <span />
            {days.map((d) => {
              const n = events.filter((e) => e.start.length && placeOnDay(e.start, e.end, d, 0, 24, tz)).length;
              const isToday = d === today;
              return (
                <Link key={d} href={dayHref(d)} className="flex flex-col items-center gap-0.5 border-l border-card-line py-3 hover:bg-sand/60">
                  <span className="text-[0.68rem] font-medium uppercase tracking-[0.14em] text-muted">{fmtDayKey(d, { weekday: "short" })}</span>
                  <span className={`flex h-8 w-8 items-center justify-center rounded-full text-base ${isToday ? "bg-cocoa text-white" : "text-espresso"}`}>
                    {Number(d.slice(8))}
                  </span>
                  <span className="h-4 text-[0.68rem] text-muted">{n ? `${n} Termin${n > 1 ? "e" : ""}` : ""}</span>
                </Link>
              );
            })}
          </div>

          {/* Raster */}
          <div className="grid" style={{ gridTemplateColumns: `3.5rem repeat(${days.length}, minmax(0, 1fr))` }}>
            <div className="relative" style={{ height }} aria-hidden="true">
              {labels.map((h) => (
                <span key={h} className="absolute right-2 -translate-y-1/2 text-[0.68rem] tabular-nums text-muted" style={{ top: px((h - fromHour) * 60) }}>
                  {h > fromHour ? `${h}:00` : ""}
                </span>
              ))}
            </div>
            {days.map((d, col) => {
              const work = hours.find((h) => h.day === d)?.windows ?? [];
              const dayEvents = events
                .map((e) => ({ e, pos: placeOnDay(e.start, e.end, d, fromHour, toHour, tz) }))
                .filter((x): x is { e: GridEvent; pos: { top: number; height: number } } => x.pos !== null);
              const dayBlocks = blocks
                .map((b) => ({ b, pos: placeOnDay(b.start, b.end, d, fromHour, toHour, tz) }))
                .filter((x): x is { b: GridBlock; pos: { top: number; height: number } } => x.pos !== null);
              return (
                <div key={d} className="relative border-l border-card-line bg-[#f7f2eb]" style={{ height }}>
                  {/* Arbeitszeit hell hinterlegt */}
                  {work.map((w) => {
                    const top = Math.max(0, toMin(w.from) - fromHour * 60);
                    const bottom = Math.min(totalMin, toMin(w.to) - fromHour * 60);
                    return bottom > top ? (
                      <div key={w.from} aria-hidden="true" className="absolute inset-x-0 bg-white" style={{ top: px(top), height: px(bottom - top) }} />
                    ) : null;
                  })}
                  {/* Stundenlinien */}
                  {labels.slice(1).map((h) => (
                    <div key={h} aria-hidden="true" className="absolute inset-x-0 border-t border-card-line/70" style={{ top: px((h - fromHour) * 60) }} />
                  ))}
                  {/* Sperrzeiten */}
                  {dayBlocks.map(({ b, pos }) => (
                    <div
                      key={b.id}
                      className="absolute inset-x-1 overflow-hidden rounded-lg border border-dashed border-caramel px-2 py-1 text-[0.7rem] text-muted"
                      style={{
                        top: px(pos.top),
                        height: px(pos.height),
                        backgroundImage: "repeating-linear-gradient(135deg, rgb(199 159 125 / 0.18) 0 6px, transparent 6px 12px)",
                      }}
                    >
                      Gesperrt{b.reason ? `: ${b.reason}` : ""}
                    </div>
                  ))}
                  {/* Termine */}
                  {dayEvents.map(({ e, pos }, i) => {
                    const h = px(pos.height);
                    return (
                      <Link
                        key={e.id}
                        href={`/admin/appointments/${e.id}`}
                        className={`anim-fade-up absolute inset-x-1 overflow-hidden rounded-lg border-l-[3px] px-2 py-1 text-left shadow-sm transition-colors ${tone[e.status] ?? tone.confirmed}`}
                        style={{ top: px(pos.top) + 1, height: Math.max(22, h - 2), "--delay": `${0.05 * col + 0.03 * i}s` } as React.CSSProperties}
                        title={`${fmtTime(e.start)}–${fmtTime(e.end)} ${e.title}, ${e.subtitle ?? ""} (${statusLabels[e.status] ?? e.status})`}
                      >
                        <span className="block truncate text-[0.72rem] font-medium leading-tight">
                          {fmtTime(e.start)} {e.title}
                        </span>
                        {h > 34 ? <span className="block truncate text-[0.68rem] leading-tight opacity-80">{e.subtitle}</span> : null}
                        {detailed && h > 52 ? (
                          <span className="mt-0.5 block truncate text-[0.68rem] leading-tight opacity-70">
                            {statusLabels[e.status]}
                            {e.meta ? ` · ${e.meta}` : ""}
                            {e.online ? " · online gebucht" : ""}
                          </span>
                        ) : null}
                      </Link>
                    );
                  })}
                  {/* Jetzt-Linie */}
                  {d === now.date && toMin(now.time) >= fromHour * 60 && toMin(now.time) <= toHour * 60 ? (
                    <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 z-10 border-t-2 border-[#a4512c]" style={{ top: px(toMin(now.time) - fromHour * 60) }}>
                      <span className="absolute -left-1 -top-[5px] h-2 w-2 rounded-full bg-[#a4512c]" />
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
