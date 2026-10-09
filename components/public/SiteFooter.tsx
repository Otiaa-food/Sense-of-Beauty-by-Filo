import Link from "next/link";
import { brand, formatAddress, openingHours } from "@/lib/brand.config";

export function SiteFooter() {
  const tel = brand.contact.phone.replace(/\s/g, "");
  return (
    <footer className="bg-espresso text-cream">
      <div className="mx-auto w-full max-w-6xl px-5 pb-10 pt-20">
        <p className="font-serif text-4xl font-light leading-none md:text-6xl">{brand.name}</p>
        <p className="mt-2 font-serif text-xl italic text-cream/70">{brand.byline}</p>

        <div className="mt-16 grid gap-12 border-t border-cream/15 pt-12 md:grid-cols-3">
          <div>
            <h2 className="font-serif text-xl text-cream">Im Studio</h2>
            <address className="mt-4 text-[0.95rem] not-italic leading-relaxed text-cream/75">
              {brand.address.street}
              <br />
              {brand.address.detail}, {brand.address.zip} {brand.address.city}
            </address>
            <p className="mt-4 text-[0.95rem] text-cream/75">
              <a href={`tel:${tel}`} className="hover:text-cream">
                {brand.contact.phone}
              </a>
            </p>
            <p className="mt-1 text-[0.95rem] text-cream/75">
              <a href={brand.contact.instagram} target="_blank" rel="noopener noreferrer" className="hover:text-cream">
                {brand.contact.instagramHandle}
              </a>
            </p>
          </div>

          <div>
            <h2 className="font-serif text-xl text-cream">Öffnungszeiten</h2>
            <dl className="mt-4 space-y-1.5 text-[0.95rem]">
              {openingHours.map((d) => (
                <div key={d.dayOfWeek} className="flex justify-between gap-6">
                  <dt className="text-cream/90">{d.label}</dt>
                  <dd className="text-cream/65">{d.open && d.close ? `${d.open}–${d.close}` : "geschlossen"}</dd>
                </div>
              ))}
            </dl>
          </div>

          <nav aria-label="Fußzeile">
            <h2 className="font-serif text-xl text-cream">Mehr</h2>
            <ul className="mt-4 space-y-2 text-[0.95rem] text-cream/75">
              <li><Link href="/treatments" className="hover:text-cream">Behandlungen</Link></li>
              <li><Link href="/book" className="hover:text-cream">Termin buchen</Link></li>
              <li><Link href="/contact" className="hover:text-cream">Kontakt und Anfahrt</Link></li>
              <li><Link href="/impressum" className="hover:text-cream">Impressum</Link></li>
              <li><Link href="/datenschutz" className="hover:text-cream">Datenschutz</Link></li>
            </ul>
          </nav>
        </div>

        <p className="mt-16 text-sm text-cream/50">© {brand.fullName}. {formatAddress()}</p>
      </div>
    </footer>
  );
}
