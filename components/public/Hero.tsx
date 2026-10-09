import Image from "next/image";
import Link from "next/link";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { brand } from "@/lib/brand.config";
import { formatPrice, lowestPrice, type CatalogGroup } from "@/lib/catalog";

/**
 * Titelbereich der Startseite.
 * - Mit Foto (brand.hero gesetzt): Foto rechts (Handy: oben), Text links, Kategorien als feine Zeile unten.
 * - tone "light": Vollbild-Foto mit hellem Text (für dunkle Fotos).
 * - Ohne Foto: ruhiger warmer Verlauf.
 * Foto tauschen = Datei in public/brand ablegen und brand.hero in lib/brand.config.ts eintragen.
 */
export function Hero({ groups }: { groups: CatalogGroup[] }) {
  const hero = brand.hero;
  const light = hero?.tone === "light";
  const split = hero !== null && !light;

  const text = light ? "text-cream" : "text-ink";
  const muted = light ? "text-cream/85" : "text-cocoa";
  const rule = light ? "border-cream/40" : "border-ink/20";

  return (
    <section className="relative isolate overflow-hidden">
      {hero ? (
        <>
          <div
            className={
              light
                ? "absolute inset-0 -z-20"
                : "relative h-[62dvh] md:absolute md:inset-y-0 md:right-0 md:-z-20 md:h-auto md:w-[52%]"
            }
          >
            <div className="photo-in absolute inset-0">
              <Image
                src={hero.src}
                alt={hero.alt}
                fill
                priority
                sizes="(min-width: 768px) 52vw, 100vw"
                className="object-cover"
                style={{ objectPosition: hero.focus }}
              />
            </div>
          </div>
          {light ? (
            <div
              aria-hidden="true"
              className="absolute inset-0 -z-10 bg-gradient-to-t from-ink/70 via-ink/25 to-ink/10 md:bg-gradient-to-r md:from-ink/65 md:via-ink/20 md:to-transparent"
            />
          ) : (
            <div
              aria-hidden="true"
              className="absolute inset-y-0 left-[48%] -z-10 hidden w-40 md:block"
              style={{ background: "linear-gradient(to right, var(--cream), transparent)" }}
            />
          )}
        </>
      ) : (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 top-10 -z-10 h-[28rem] w-[28rem] rounded-full opacity-70 blur-2xl md:right-0 md:h-[36rem] md:w-[36rem]"
          style={{ background: "radial-gradient(circle at 40% 40%, #EBDDC9 0%, #D9B793 45%, transparent 70%)" }}
        />
      )}

      <div
        className={`relative mx-auto flex w-full max-w-6xl flex-col px-5 pb-10 md:min-h-[90dvh] md:justify-center md:pb-14 ${
          split ? "pt-12 md:pt-20" : light ? "min-h-[88dvh] justify-end pt-24" : "min-h-[78dvh] justify-center pt-20"
        }`}
      >
        <p className={`rise font-serif text-xl italic ${muted}`} style={{ animationDelay: "0.25s" }}>
          Korean Skincare in {brand.address.city}
        </p>
        <h1
          className={`rise mt-5 font-serif text-[3.4rem] font-light leading-[0.98] tracking-[-0.02em] sm:text-7xl md:text-[5.6rem] ${text} ${
            split ? "md:max-w-[36rem]" : "max-w-3xl"
          }`}
          style={{ animationDelay: "0.45s" }}
        >
          Deine Haut darf wieder strahlen.
        </h1>
        <p
          className={`rise mt-8 max-w-md text-[1.05rem] font-[350] leading-8 ${muted}`}
          style={{ animationDelay: "0.7s" }}
        >
          Bei {brand.fullName} bekommst du eine Korean-Skincare-Behandlung, die zu deiner Haut passt, persönlich
          abgestimmt und in ruhiger Atmosphäre.
        </p>
        <div className="rise mt-10 flex flex-wrap items-center gap-x-8 gap-y-3" style={{ animationDelay: "0.9s" }}>
          <ButtonLink href="/book" variant={light ? "onDark" : "primary"}>
            Termin buchen
          </ButtonLink>
          <ButtonLink href="/treatments" variant={light ? "onDarkQuiet" : "secondary"}>
            Behandlungen ansehen
          </ButtonLink>
        </div>
        <p className={`rise mt-5 text-sm ${muted}`} style={{ animationDelay: "1s" }}>
          Kostenlos stornieren bis {brand.booking.freeCancellationHours} Stunden vor dem Termin.
        </p>

        {groups.length > 0 ? (
          <ul className="rise mt-14 grid gap-x-8 gap-y-5 sm:grid-cols-3 md:mt-20" style={{ animationDelay: "1.1s" }}>
            {groups.map(({ category, services }) => {
              const from = lowestPrice(services);
              return (
                <li key={category.id}>
                  <Link href={`/treatments#${category.slug}`} className={`group block border-t pt-4 ${rule}`}>
                    <span className={`block font-serif text-2xl leading-tight transition-colors group-hover:text-caramel ${text}`}>
                      {category.name}
                    </span>
                    {from !== null ? (
                      <span className={`mt-1 block text-sm ${muted}`}>ab {formatPrice(from)}</span>
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : null}
      </div>
    </section>
  );
}
