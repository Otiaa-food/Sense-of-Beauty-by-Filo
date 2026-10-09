import Link from "next/link";
import { Logo } from "@/components/public/Logo";
import { MobileMenu } from "@/components/public/MobileMenu";
import { mainNav } from "@/components/public/nav";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-line/60 bg-white">
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-5 md:px-8">
        <Logo />

        {/* Desktop: Leiste mit Untermenüs (öffnen bei Maus und Tastatur, ohne JavaScript) */}
        <nav aria-label="Hauptmenü" className="hidden items-center gap-9 lg:flex">
          {mainNav.map((item) => (
            <div key={item.label} className="group relative">
              <Link href={item.href} className="block py-6 text-[0.85rem] text-muted transition-colors hover:text-espresso">
                {item.label}
              </Link>
              {item.children ? (
                <ul className="invisible absolute left-1/2 top-full min-w-52 -translate-x-1/2 border border-line/70 bg-white py-3 opacity-0 transition-opacity group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
                  {item.children.map((c) => (
                    <li key={c.href}>
                      <Link href={c.href} className="block px-6 py-2.5 text-[0.85rem] text-muted hover:bg-paper hover:text-espresso">
                        {c.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ))}
          <Link href="/book" className="label inline-flex min-h-11 items-center bg-espresso px-6 text-white transition-colors hover:bg-taupe">
            Termin buchen
          </Link>
        </nav>

        <MobileMenu />
      </div>
    </header>
  );
}
