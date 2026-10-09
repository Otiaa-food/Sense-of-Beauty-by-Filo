import type { Metadata } from "next";
import Image from "next/image";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { brand } from "@/lib/brand.config";

export const metadata: Metadata = {
  title: "Über Filo",
  description: "Lerne Filo kennen, deine Kosmetikerin für Korean Skincare in Pforzheim.",
  alternates: { canonical: "/about" },
};

// Hinweis: Filos persönlicher Werdegang, Ausbildungen und Fotos fehlen noch.
// Sie werden hier ergänzt, sobald Filo sie liefert. Es werden keine Angaben erfunden.
export default function AboutPage() {
  return (
    <section className="mx-auto w-full max-w-3xl px-5 py-20 md:py-32">
      <h1 className="font-serif text-5xl font-light leading-[1.02] tracking-[-0.02em] text-ink md:text-7xl">
        Hautpflege, die bei dir anfängt.
      </h1>

      <div className="mx-auto mt-14 w-full max-w-sm overflow-hidden rounded-t-[999px] bg-sand">
        <Image
          src={brand.portrait.src}
          alt={brand.portrait.alt}
          width={brand.portrait.width}
          height={brand.portrait.height}
          sizes="(min-width: 768px) 384px, 100vw"
          priority
          className="aspect-[4/5] h-auto w-full object-cover object-top"
        />
      </div>

      <div className="mt-14 space-y-6 text-[1.1rem] font-[350] leading-8 text-cocoa">
        <p>
          {brand.fullName} ist ein Kosmetikstudio in {brand.address.city}, das sich auf Korean Skincare
          spezialisiert hat. Filo verbindet Wirkstoffkosmetik nach koreanischem Vorbild mit etwas, das viele
          Kundinnen vermissen: Zeit und persönliche Aufmerksamkeit.
        </p>
        <p>
          Bevor sie behandelt, schaut Filo sich deine Haut an. Danach empfiehlt sie dir die Behandlung, die dazu
          passt, und sagt dir auch, wenn du etwas nicht brauchst.
        </p>
        <p>
          Neben den Korean Facials findest du bei ihr Laserbehandlungen zur Haarentfernung und Behandlungen für
          Wimpern.
        </p>
      </div>

      <div className="mt-12 flex flex-wrap items-center gap-x-8 gap-y-3">
        <ButtonLink href="/book">Termin buchen</ButtonLink>
        <ButtonLink href="/treatments" variant="secondary">
          Behandlungen ansehen
        </ButtonLink>
      </div>
    </section>
  );
}
