import Link from "next/link";
import { Logo } from "@/components/public/Logo";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { brand, openingHours } from "@/lib/brand.config";

export function SiteFooter() {
  const tel = brand.contact.phone.replace(/\s/g, "");
  return (
    <footer className="bg-stone">
      <div className="mx-auto grid max-w-7xl gap-12 px-5 py-16 md:grid-cols-[1.2fr_1fr_1fr_auto] md:px-8 md:py-20">
        <div>
          <h2 className="label text-espresso">Kontakt</h2>
          <ul className="mt-5 space-y-2 text-[0.9rem] text-muted">
            <li>
              <a href={`tel:${tel}`} className="hover:text-espresso">
                {brand.contact.phone}
              </a>
            </li>
            <li>
              {brand.address.street}, {brand.address.detail}
              <br />
              {brand.address.zip} {brand.address.city}
            </li>
          </ul>
          <dl className="mt-6 max-w-64 space-y-1 text-[0.85rem] text-muted">
            {openingHours.map((d) => (
              <div key={d.dayOfWeek} className="flex justify-between gap-6">
                <dt>{d.label}</dt>
                <dd>{d.open && d.close ? `${d.open}–${d.close}` : "geschlossen"}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-8">
            <ButtonLink href="/book">Termin buchen</ButtonLink>
          </div>
        </div>

        <nav aria-label="Menü in der Fußzeile">
          <h2 className="label text-espresso">Menü</h2>
          <ul className="mt-5 space-y-2 text-[0.9rem] text-muted">
            <li><Link href="/treatments" className="hover:text-espresso">Behandlungen & Preise</Link></li>
            <li><Link href="/about" className="hover:text-espresso">Über Filo</Link></li>
            <li><Link href="/studio" className="hover:text-espresso">Studio</Link></li>
            <li><Link href="/pflegehinweise" className="hover:text-espresso">Pflegehinweise</Link></li>
            <li><Link href="/contact" className="hover:text-espresso">Kontakt und Anfahrt</Link></li>
          </ul>
        </nav>

        <nav aria-label="Rechtliches">
          <h2 className="label text-espresso">Rechtliches</h2>
          <ul className="mt-5 space-y-2 text-[0.9rem] text-muted">
            <li><Link href="/stornierung" className="hover:text-espresso">Stornierung</Link></li>
            <li><Link href="/impressum" className="hover:text-espresso">Impressum</Link></li>
            <li><Link href="/datenschutz" className="hover:text-espresso">Datenschutz</Link></li>
          </ul>
        </nav>

        <div className="md:text-right">
          <Logo />
        </div>
      </div>
      <p className="border-t border-line px-5 py-6 text-center text-xs text-muted">© {brand.fullName}</p>
    </footer>
  );
}
