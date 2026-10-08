import type { Metadata } from "next";
import Link from "next/link";

// Der Admin-Bereich soll nie in Suchmaschinen auftauchen.
export const metadata: Metadata = {
  title: { default: "Admin", template: "%s | Admin" },
  robots: { index: false, follow: false },
};

const links = [
  { href: "/admin", label: "Übersicht" },
  { href: "/admin/calendar", label: "Kalender" },
  { href: "/admin/appointments", label: "Termine" },
  { href: "/admin/customers", label: "Kundinnen" },
  { href: "/admin/services", label: "Behandlungen" },
  { href: "/admin/availability", label: "Zeiten" },
  { href: "/admin/reviews", label: "Stimmen" },
  { href: "/admin/settings", label: "Einstellungen" },
] as const;

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col md:flex-row">
      <nav
        aria-label="Admin-Navigation"
        className="flex gap-1 overflow-x-auto border-b border-line bg-sand/40 p-2 md:w-56 md:flex-col md:border-b-0 md:border-r md:p-4"
      >
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="whitespace-nowrap rounded-xl px-4 py-2.5 text-sm text-cocoa hover:bg-cream hover:text-ink"
          >
            {l.label}
          </Link>
        ))}
      </nav>
      <main className="flex-1 p-5 md:p-10">{children}</main>
    </div>
  );
}
