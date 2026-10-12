"use client";

import {
  CalendarDays,
  ChartColumn,
  Clock,
  Hourglass,
  LayoutDashboard,
  ListChecks,
  Megaphone,
  Sparkles,
  Star,
  Users,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type Item = { href: string; label: string; icon: LucideIcon };

/** Navigation in Gruppen, damit die Bereiche klar getrennt sind */
export const navGroups: { title: string; items: Item[] }[] = [
  {
    title: "Tag",
    items: [
      { href: "/admin", label: "Übersicht", icon: LayoutDashboard },
      { href: "/admin/kalender", label: "Kalender", icon: CalendarDays },
      { href: "/admin/appointments", label: "Termine", icon: ListChecks },
      { href: "/admin/warteliste", label: "Warteliste", icon: Hourglass },
    ],
  },
  {
    title: "Kundinnen",
    items: [
      { href: "/admin/customers", label: "Kundinnen", icon: Users },
      { href: "/admin/kampagnen", label: "Kampagnen", icon: Megaphone },
      { href: "/admin/reviews", label: "Bewertungen", icon: Star },
    ],
  },
  {
    title: "Studio",
    items: [
      { href: "/admin/statistik", label: "Statistik", icon: ChartColumn },
      { href: "/admin/services", label: "Behandlungen", icon: Sparkles },
      { href: "/admin/availability", label: "Zeiten & Urlaub", icon: Clock },
    ],
  },
];

function isActive(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Admin-Navigation" className="flex gap-1 overflow-x-auto px-3 pb-3 md:block md:space-y-6 md:overflow-visible md:px-4 md:pb-0">
      {navGroups.map((g) => (
        <div key={g.title} className="flex gap-1 md:block md:space-y-0.5">
          <p className="hidden px-3 pb-1.5 text-[0.62rem] font-medium uppercase tracking-[0.2em] text-white/40 md:block">{g.title}</p>
          {g.items.map(({ href, label, icon: Icon }) => {
            const active = isActive(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex shrink-0 items-center gap-3 whitespace-nowrap rounded-xl px-3 py-2.5 text-sm transition-colors ${
                  active ? "bg-cocoa text-white shadow-[inset_0_0_0_1px_rgb(255_255_255/0.08)]" : "text-white/70 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Icon size={17} strokeWidth={1.6} aria-hidden="true" className={active ? "text-white" : "text-caramel"} />
                {label}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
