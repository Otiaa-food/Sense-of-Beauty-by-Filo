import Link from "next/link";
import { brand, formatAddress, openingHours } from "@/lib/brand.config";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-line bg-sand/40">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 md:grid-cols-3">
        <div>
          <p className="font-serif text-2xl text-ink">{brand.fullName}</p>
          <p className="mt-2 text-sm text-cocoa">{brand.tagline}</p>
          <address className="mt-5 text-sm not-italic leading-relaxed text-cocoa">
            {formatAddress()}
          </address>
        </div>

        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-cocoa">Öffnungszeiten</p>
          <dl className="mt-4 space-y-1 text-sm text-ink">
            {openingHours.map((d) => (
              <div key={d.dayOfWeek} className="flex justify-between gap-6">
                <dt>{d.label}</dt>
                <dd className="text-cocoa">
                  {d.open && d.close ? `${d.open}–${d.close}` : "geschlossen"}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <nav aria-label="Fußzeile">
          <p className="text-xs uppercase tracking-[0.25em] text-cocoa">Mehr</p>
          <ul className="mt-4 space-y-2 text-sm text-ink">
            <li><Link href="/book" className="hover:text-cocoa">Termin buchen</Link></li>
            <li><Link href="/contact" className="hover:text-cocoa">Kontakt</Link></li>
            <li><Link href="/impressum" className="hover:text-cocoa">Impressum</Link></li>
            <li><Link href="/datenschutz" className="hover:text-cocoa">Datenschutz</Link></li>
          </ul>
        </nav>
      </div>
      <p className="border-t border-line/70 py-5 text-center text-xs text-cocoa">
        © {brand.fullName}
      </p>
    </footer>
  );
}
