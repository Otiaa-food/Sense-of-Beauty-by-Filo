import Image from "next/image";
import { HeroVideo } from "@/components/public/HeroVideo";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { brand } from "@/lib/brand.config";
import { heroMedia } from "@/lib/media";

/**
 * Titelbereich: Foto oder kurzes Video über die volle Breite, Text unten links in Weiß (wie Lumo).
 * Medien tauschen: lib/media.ts → heroMedia.
 */
export function Hero() {
  return (
    <section className="relative isolate flex min-h-[calc(100svh-72px)] items-end overflow-hidden bg-espresso">
      <div className="media-in absolute inset-0 -z-20">
        {heroMedia.kind === "video" ? (
          <HeroVideo src={heroMedia.src} poster={heroMedia.poster.src} />
        ) : (
          <Image
            src={heroMedia.src}
            alt={heroMedia.alt}
            fill
            priority
            sizes="100vw"
            className="object-cover"
            style={{ objectPosition: heroMedia.focus }}
          />
        )}
      </div>
      {/* Abdunklung unten, damit der Text lesbar bleibt */}
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-t from-black/70 via-black/25 to-black/5" />

      <div className="mx-auto w-full max-w-7xl px-5 pb-14 pt-40 text-white md:px-8 md:pb-20">
        <p className="text-lg font-medium">Willkommen bei</p>
        <h1 className="mt-2 text-[3.1rem] font-light lowercase leading-[1] tracking-[-0.01em] sm:text-7xl lg:text-[6.5rem]">
          {brand.name}
        </h1>
        <p className="mt-4 text-xl font-light md:text-2xl">{brand.tagline}</p>
        <p className="mt-6 max-w-xl text-[1.05rem] leading-relaxed text-white/90 md:text-lg">
          Korean Skincare in {brand.address.city}: Gesichtsbehandlungen mit Wirkstoffkosmetik nach koreanischem
          Vorbild, persönlich auf deine Haut abgestimmt.
        </p>
        <div className="mt-9 flex flex-wrap gap-3">
          <ButtonLink href="/book" variant="light">
            Termin buchen
          </ButtonLink>
          <ButtonLink href="/treatments" variant="outlineLight">
            Behandlungen
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
