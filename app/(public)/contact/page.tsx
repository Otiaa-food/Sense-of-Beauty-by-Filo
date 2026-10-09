import type { Metadata } from "next";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { brand, mapsDirectionsUrl, openingHours } from "@/lib/brand.config";

export const metadata: Metadata = {
  title: "Kontakt und Anfahrt",
  description: `So findest du ${brand.fullName} in ${brand.address.city}: Adresse, Öffnungszeiten und Anfahrt.`,
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  const tel = brand.contact.phone.replace(/\s/g, "");
  return (
    <section className="mx-auto w-full max-w-5xl px-5 py-20 md:py-32">
      <h1 className="font-serif text-5xl font-light leading-[1.02] tracking-[-0.02em] text-ink md:text-7xl">
        Kontakt und Anfahrt
      </h1>

      <div className="mt-16 grid gap-16 md:grid-cols-2 md:gap-24">
        <div>
          <h2 className="font-serif text-2xl text-ink">Im Studio</h2>
          <address className="mt-4 text-[1.05rem] font-[350] not-italic leading-8 text-cocoa">
            {brand.fullName}
            <br />
            {brand.address.street}
            <br />
            {brand.address.detail}, {brand.address.zip} {brand.address.city}
          </address>
          <div className="mt-6">
            <ButtonLink href={mapsDirectionsUrl()} external variant="secondary">
              Route anzeigen
            </ButtonLink>
          </div>

          <h2 className="mt-14 font-serif text-2xl text-ink">Schreib oder ruf an</h2>
          <ul className="mt-4 space-y-2 text-[1.05rem] font-[350] text-cocoa">
            <li>
              <a href={`tel:${tel}`} className="text-ink underline decoration-ink/30 underline-offset-4 hover:decoration-ink">
                {brand.contact.phone}
              </a>
            </li>
            {brand.contact.email ? (
              <li>
                <a href={`mailto:${brand.contact.email}`} className="text-ink underline decoration-ink/30 underline-offset-4 hover:decoration-ink">
                  {brand.contact.email}
                </a>
              </li>
            ) : null}
            <li>
              <a href={brand.contact.instagram} target="_blank" rel="noopener noreferrer" className="text-ink underline decoration-ink/30 underline-offset-4 hover:decoration-ink">
                Instagram {brand.contact.instagramHandle}
              </a>
            </li>
            <li>
              <a href={brand.contact.googleBusinessUrl} target="_blank" rel="noopener noreferrer" className="text-ink underline decoration-ink/30 underline-offset-4 hover:decoration-ink">
                Studio auf Google
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h2 className="font-serif text-2xl text-ink">Öffnungszeiten</h2>
          <dl className="mt-4 divide-y divide-line border-y border-line">
            {openingHours.map((d) => (
              <div key={d.dayOfWeek} className="flex justify-between gap-6 py-3">
                <dt className="text-ink">{d.label}</dt>
                <dd className="text-cocoa">{d.open && d.close ? `${d.open}–${d.close}` : "geschlossen"}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
