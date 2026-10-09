import Link from "next/link";
import { brand } from "@/lib/brand.config";

const nav = [
  { href: "/treatments", label: "Behandlungen" },
  { href: "/about", label: "Über Filo" },
  { href: "/reviews", label: "Stimmen" },
  { href: "/contact", label: "Kontakt" },
] as const;

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-line/60 bg-cream/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <Link href="/" aria-label={`${brand.fullName}, zur Startseite`} className="leading-none">
          <span className="block font-serif text-[1.7rem] font-light tracking-wide text-ink">
            {brand.name}
          </span>
          <span className="block font-serif text-sm italic text-cocoa">{brand.byline}</span>
        </Link>

        <nav aria-label="Hauptnavigation" className="hidden items-center gap-8 md:flex">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-[0.95rem] tracking-wide text-cocoa transition-colors hover:text-ink"
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/book"
            className="rounded-full bg-ink px-6 py-2.5 text-sm tracking-wide text-cream transition-colors hover:bg-cocoa"
          >
            Termin buchen
          </Link>
        </nav>

        {/* Handy: Menü ohne JavaScript über <details> */}
        <details className="group relative md:hidden">
          <summary className="flex h-11 w-11 cursor-pointer list-none items-center justify-center rounded-full text-cocoa [&::-webkit-details-marker]:hidden">
            <span className="sr-only">Menü öffnen</span>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              <path d="M4 8h16M4 16h16" strokeLinecap="round" />
            </svg>
          </summary>
          <nav
            aria-label="Mobile Navigation"
            className="absolute right-0 mt-2 w-60 rounded-2xl border border-line bg-cream p-3 shadow-sm"
          >
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block rounded-xl px-4 py-3 text-cocoa hover:bg-sand/60"
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/book"
              className="mt-2 block rounded-full bg-ink px-4 py-3 text-center text-cream"
            >
              Termin buchen
            </Link>
          </nav>
        </details>
      </div>
    </header>
  );
}
