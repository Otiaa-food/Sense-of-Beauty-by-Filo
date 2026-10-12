import Link from "next/link";
import { monthCells } from "@/lib/admin/calendar";

const weekdays = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

/**
 * Monatsraster (Montag zuerst, 6 Wochen). Was in einem Tag steht, bestimmt die Seite über `cell`.
 * Wird im Kalender, bei den Terminen und bei Zeiten & Urlaub benutzt.
 */
export function MonthGrid({
  month,
  today,
  selected,
  href,
  cell,
  compact = false,
  dayClass,
}: {
  month: string;
  today: string;
  selected?: string;
  href: (day: string) => string;
  cell?: (day: string) => React.ReactNode;
  compact?: boolean;
  dayClass?: (day: string) => string;
}) {
  const days = monthCells(month);
  return (
    <div>
      <div className="grid grid-cols-7 gap-1.5" aria-hidden="true">
        {weekdays.map((w) => (
          <span key={w} className="pb-1 text-center text-[0.68rem] font-medium uppercase tracking-[0.14em] text-muted">
            {w}
          </span>
        ))}
      </div>
      <ol className="grid grid-cols-7 gap-1.5">
        {days.map((day, i) => {
          const inMonth = day.startsWith(month);
          const isToday = day === today;
          const isSelected = day === selected;
          return (
            <li key={day} className="anim-fade-up" style={{ "--delay": `${Math.floor(i / 7) * 0.03}s` } as React.CSSProperties}>
              <Link
                href={href(day)}
                aria-current={isToday ? "date" : undefined}
                aria-label={new Intl.DateTimeFormat("de-DE", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }).format(new Date(`${day}T12:00:00Z`))}
                className={`group flex flex-col rounded-xl border p-1.5 transition-colors ${compact ? "min-h-11 items-center justify-center" : "min-h-24 md:min-h-28"} ${
                  isSelected
                    ? "border-espresso bg-espresso text-white"
                    : `border-card-line ${inMonth ? "bg-white hover:border-caramel" : "bg-sand/50 text-muted/60 hover:border-caramel"} ${dayClass?.(day) ?? ""}`
                }`}
              >
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm ${
                    isToday && !isSelected ? "bg-cocoa text-white" : ""
                  } ${compact ? "" : "self-start"}`}
                >
                  {Number(day.slice(8))}
                </span>
                {cell ? <span className={`min-w-0 ${compact ? "" : "mt-1 w-full"}`}>{cell(day)}</span> : null}
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
