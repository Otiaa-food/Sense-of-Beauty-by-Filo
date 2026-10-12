import { LogOut, Plus } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { logout } from "@/app/admin/login/actions";
import { AdminNav } from "@/components/admin/AdminNav";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-sand md:flex-row">
      {/* Dunkle Seitenleiste wie in einer App: Logo, Navigation in Gruppen, Abmelden unten */}
      <aside className="bg-sidebar text-white md:sticky md:top-0 md:flex md:h-dvh md:w-64 md:shrink-0 md:flex-col">
        <div className="flex items-center justify-between gap-4 px-5 py-4 md:block md:px-6 md:pb-8 md:pt-8">
          <Link href="/admin" className="flex items-center gap-3">
            <span
              aria-hidden="true"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-caramel/60 text-lg font-light lowercase text-caramel"
            >
              s
            </span>
            <span className="leading-none">
              <span className="block text-[1.05rem] font-light lowercase">sense of beauty</span>
              <span className="mt-1 block text-[0.58rem] uppercase tracking-[0.32em] text-white/50">by filo · Admin</span>
            </span>
          </Link>
          <Link
            href="/admin/appointments/new"
            className="inline-flex min-h-10 items-center gap-2 rounded-full bg-caramel px-4 text-sm font-medium text-sidebar transition-colors hover:bg-white md:mt-8 md:flex md:min-h-11 md:w-full md:justify-center"
          >
            <Plus size={16} strokeWidth={2} aria-hidden="true" /> Termin
          </Link>
        </div>
        <div className="md:flex-1 md:overflow-y-auto md:pb-6">
          <Suspense fallback={null}>
            <AdminNav />
          </Suspense>
        </div>
        <form action={logout} className="hidden border-t border-white/10 px-4 py-4 md:block">
          <button type="submit" className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-white/60 hover:bg-white/5 hover:text-white">
            <LogOut size={17} strokeWidth={1.6} aria-hidden="true" /> Abmelden
          </button>
        </form>
      </aside>
      <main className="min-w-0 flex-1 px-4 py-7 sm:px-6 md:px-10 md:py-10">
        <div className="mx-auto max-w-6xl">{children}</div>
        <form action={logout} className="mt-12 md:hidden">
          <button type="submit" className="flex items-center gap-2 text-sm text-muted">
            <LogOut size={16} aria-hidden="true" /> Abmelden
          </button>
        </form>
      </main>
    </div>
  );
}
