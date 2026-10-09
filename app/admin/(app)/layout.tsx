import Link from "next/link";
import { logout } from "@/app/admin/login/actions";

const links = [
  { href: "/admin", label: "Kalender" },
  { href: "/admin/appointments", label: "Termine" },
  { href: "/admin/customers", label: "Kundinnen" },
  { href: "/admin/services", label: "Behandlungen" },
  { href: "/admin/availability", label: "Zeiten & Urlaub" },
] as const;

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col md:flex-row">
      <aside className="border-b border-line bg-white md:w-60 md:shrink-0 md:border-b-0 md:border-r">
        <div className="flex items-center justify-between px-5 py-4 md:block md:px-6 md:py-8">
          <Link href="/admin" className="block leading-none text-espresso">
            <span className="block text-lg font-light lowercase">sense of beauty</span>
            <span className="label mt-1 block !text-[0.6rem] text-muted">Admin</span>
          </Link>
          <Link href="/admin/appointments/new" className="label inline-flex min-h-10 items-center bg-espresso px-4 text-white md:mt-8 md:flex md:min-h-12 md:justify-center">
            + Termin
          </Link>
        </div>
        <nav aria-label="Admin-Navigation" className="flex gap-1 overflow-x-auto px-3 pb-3 md:flex-col md:px-3">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="whitespace-nowrap px-3 py-2.5 text-sm text-muted hover:bg-paper hover:text-espresso">
              {l.label}
            </Link>
          ))}
          <form action={logout} className="md:mt-6">
            <button type="submit" className="whitespace-nowrap px-3 py-2.5 text-left text-sm text-muted hover:text-espresso">
              Abmelden
            </button>
          </form>
        </nav>
      </aside>
      <main className="min-w-0 flex-1 px-5 py-8 md:px-10 md:py-10">{children}</main>
    </div>
  );
}
