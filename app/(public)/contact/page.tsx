import type { Metadata } from "next";
import { brand, formatAddress, mapsDirectionsUrl, openingHours } from "@/lib/brand.config";

export const metadata: Metadata = {
  title: "Kontakt und Anfahrt",
  description: `So findest du ${brand.fullName} in ${brand.address.city}: Adresse, Öffnungszeiten und Anfahrt.`,
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <section className="mx-auto w-full max-w-3xl px-5 py-20 md:py-28">
      <h1 className="font-serif text-4xl text-ink md:text-5xl">Kontakt und Anfahrt</h1>
      <address className="mt-8 text-lg not-italic leading-relaxed text-cocoa">
        {brand.fullName}
        <br />
        {formatAddress()}
      </address>
      <a
        href={mapsDirectionsUrl()}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-6 inline-block rounded-full border border-cocoa px-6 py-2.5 text-sm tracking-wide text-cocoa hover:bg-sand/60"
      >
        Route anzeigen
      </a>

      <ul className="mt-10 space-y-3 text-cocoa">
        <li>
          Telefon:{" "}
          <a href={`tel:${brand.contact.phone.replace(/\s/g, "")}`} className="text-ink underline underline-offset-4">
            {brand.contact.phone}
          </a>
        </li>
        {brand.contact.email ? (
          <li>
            E-Mail:{" "}
            <a href={`mailto:${brand.contact.email}`} className="text-ink underline underline-offset-4">
              {brand.contact.email}
            </a>
          </li>
        ) : null}
        <li>
          Instagram:{" "}
          <a href={brand.contact.instagram} target="_blank" rel="noopener noreferrer" className="text-ink underline underline-offset-4">
            {brand.contact.instagramHandle}
          </a>
        </li>
        <li>
          <a href={brand.contact.googleBusinessUrl} target="_blank" rel="noopener noreferrer" className="text-ink underline underline-offset-4">
            Studio auf Google
          </a>
        </li>
      </ul>

      <h2 className="mt-14 font-serif text-2xl text-ink">Öffnungszeiten</h2>
      <dl className="mt-4 max-w-sm space-y-1 text-ink">
        {openingHours.map((d) => (
          <div key={d.dayOfWeek} className="flex justify-between gap-6">
            <dt>{d.label}</dt>
            <dd className="text-cocoa">
              {d.open && d.close ? `${d.open}–${d.close}` : "geschlossen"}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
