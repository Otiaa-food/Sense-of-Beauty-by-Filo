import Image from "next/image";
import Link from "next/link";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { brand } from "@/lib/brand.config";
import type { CatalogGroup } from "@/lib/catalog";

/**
 * Titelbereich der Startseite.
 * - Mit Foto (brand.hero gesetzt): Vollbild-Foto, heller Text, Glas-Karten darauf (ADLN-Look).
 * - Ohne Foto: ruhiger warmer Verlauf.
 * Foto tauschen = Datei in public/brand ablegen und brand.hero in lib/brand.config.ts eintragen.
 */
export function Hero({ groups }: { groups: CatalogGroup[] }) {
  const hero = brand.hero;
  const onPhoto = hero !== null;

  const text = onPhoto ? "text-cream" : "text-ink";
  const muted = onPhoto ? "text-cream/85" : "text-cocoa";

  return (
    <section className="relative isolate overflow-hidden">
      {hero ? (
        <>
          <Image
            src={hero.src}
            alt={hero.alt}
            fill
            priority
            sizes="100vw"
            className="-z-20 object-cover"
            style={{ objectPosition: hero.focus }}
          />
          {/* Abdunklung links/unten, damit Text und Karten gut lesbar bleiben */}
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-10 bg-gradient-to-t from-ink/70 via-ink/25 to-ink/10 md:bg-gradient-to-r md:from-ink/65 md:via-ink/20 md:to-transparent"
          />
        </>
      ) : (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 top-10 -z-10 h-[28rem] w-[28rem] rounded-full opacity-70 blur-2xl md:right-0 md:h-[36rem] md:w-[36rem]"
          style={{ background: "radial-gradient(circle at 40% 40%, #E9DBC8 0%, #D9B793 45%, transparent 70%)" }}
        />
      )}

      <div className="relative mx-auto flex min-h-[88dvh] w-full max-w-6xl flex-col justify-end px-5 pb-10 pt-24 md:justify-center md:pb-16">
        <p className={`text-xs uppercase tracking-[0.35em] ${muted}`}>Korean Skincare in {brand.address.city}</p>
        <h1 className={`mt-6 max-w-3xl font-serif text-5xl leading-[1.04] md:text-7xl ${text}`}>
          Deine Haut darf wieder strahlen.
        </h1>
        <p className={`mt-7 max-w-xl text-lg leading-relaxed ${muted}`}>
          Bei {brand.fullName} bekommst du eine Korean-Skincare-Behandlung, die zu deiner Haut passt, persönlich
          abgestimmt und in ruhiger Atmosphäre.
        </p>
        <div className="mt-10 flex flex-wrap gap-4">
          {onPhoto ? (
            <>
              <Link
                href="/book"
                className="inline-flex min-h-11 items-center justify-center rounded-full bg-cream px-7 py-3 text-sm tracking-wide text-ink transition-colors hover:bg-sand"
              >
                Termin buchen
              </Link>
              <Link
                href="/treatments"
                className="inline-flex min-h-11 items-center justify-center rounded-full border border-cream/70 px-7 py-3 text-sm tracking-wide text-cream transition-colors hover:bg-cream/15"
              >
                Behandlungen ansehen
              </Link>
            </>
          ) : (
            <>
              <ButtonLink href="/book">Termin buchen</ButtonLink>
              <ButtonLink href="/treatments" variant="secondary">
                Behandlungen ansehen
              </ButtonLink>
            </>
          )}
        </div>
        <p className={`mt-6 text-sm ${muted}`}>
          Kostenlos stornieren bis {brand.booking.freeCancellationHours} Stunden vor dem Termin.
        </p>

        {groups.length > 0 ? (
          <ul className="mt-12 grid gap-3 sm:grid-cols-3">
            {groups.map(({ category, services }) => (
              <li key={category.id}>
                <Link
                  href={`/treatments#${category.slug}`}
                  className={
                    onPhoto
                      ? "flex h-full min-h-24 flex-col justify-between rounded-2xl border border-cream/30 bg-cream/15 p-5 text-cream backdrop-blur-md transition-colors hover:bg-cream/25"
                      : "flex h-full min-h-24 flex-col justify-between rounded-2xl border border-white/50 bg-white/40 p-5 text-ink backdrop-blur transition-colors hover:bg-white/60"
                  }
                >
                  <span className="text-xs uppercase tracking-[0.25em]">{category.name}</span>
                  <span className="mt-3 text-sm">
                    {services.length} {services.length === 1 ? "Behandlung" : "Behandlungen"}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  );
}
