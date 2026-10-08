import Image from "next/image";
import Link from "next/link";
import { CatalogUnavailable } from "@/components/public/CatalogUnavailable";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { brand, formatAddress } from "@/lib/brand.config";
import { formatPrice, groupCatalog, lowestPrice } from "@/lib/catalog";
import { getCatalog } from "@/lib/data/catalog";

const recognitions = [
  "Du pflegst deine Haut gewissenhaft, und sie wirkt trotzdem müde und fahl.",
  "Zwischen unzähligen Produkten weißt du längst nicht mehr, was wirklich zu deiner Haut passt.",
  "Du wünschst dir Pflege, die auf dich abgestimmt ist, statt einer Behandlung von der Stange.",
];

const steps = [
  {
    title: "Termin online buchen",
    text: "Such dir Behandlung und Wunschzeit aus. Du bekommst sofort deine Bestätigung.",
  },
  {
    title: "Persönliche Hautanalyse",
    text: "Bei den Korean Facials schaut sich Filo zuerst deine Haut an und empfiehlt dir die passende Behandlung.",
  },
  {
    title: "Behandlung und Pflege-Tipps",
    text: "Du wirst in Ruhe behandelt und gehst mit einem klaren Plan für zu Hause nach Hause.",
  },
];

export default async function HomePage() {
  const catalog = await getCatalog();
  const groups = groupCatalog(catalog.categories, catalog.services);

  return (
    <>
      {/* 1. Held:in und Versprechen */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 top-10 h-[28rem] w-[28rem] rounded-full opacity-70 blur-2xl md:right-0 md:h-[36rem] md:w-[36rem]"
          style={{ background: "radial-gradient(circle at 40% 40%, #E9DBC8 0%, #D9B793 45%, transparent 70%)" }}
        />
        <div className="relative mx-auto flex min-h-[78dvh] w-full max-w-6xl flex-col justify-center px-5 py-20">
          <p className="text-xs uppercase tracking-[0.35em] text-cocoa">
            Korean Skincare in {brand.address.city}
          </p>
          <h1 className="mt-6 max-w-3xl font-serif text-5xl leading-[1.04] text-ink md:text-7xl">
            Deine Haut darf wieder strahlen.
          </h1>
          <p className="mt-7 max-w-xl text-lg leading-relaxed text-cocoa">
            Bei {brand.fullName} bekommst du eine Korean-Skincare-Behandlung, die zu deiner Haut passt,
            persönlich abgestimmt und in ruhiger Atmosphäre.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <ButtonLink href="/book">Termin buchen</ButtonLink>
            <ButtonLink href="/treatments" variant="secondary">
              Behandlungen ansehen
            </ButtonLink>
          </div>
          <p className="mt-6 text-sm text-cocoa">
            Kostenlos stornieren bis {brand.booking.freeCancellationHours} Stunden vor dem Termin.
          </p>

          {catalog.ok && groups.length > 0 ? (
            <ul className="mt-14 grid gap-3 sm:grid-cols-3">
              {groups.map(({ category, services }) => (
                <li key={category.id}>
                  <Link
                    href={`/treatments#${category.slug}`}
                    className="flex h-full min-h-24 flex-col justify-between rounded-2xl border border-white/50 bg-white/40 p-5 backdrop-blur transition-colors hover:bg-white/60"
                  >
                    <span className="text-xs uppercase tracking-[0.25em] text-cocoa">{category.name}</span>
                    <span className="mt-3 text-sm text-ink">
                      {services.length} {services.length === 1 ? "Behandlung" : "Behandlungen"}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </section>

      {/* 2. Das Problem */}
      <section className="bg-sand/40">
        <div className="mx-auto w-full max-w-6xl px-5 py-20 md:py-28">
          <h2 className="max-w-2xl font-serif text-3xl leading-tight text-ink md:text-5xl">
            Kennst du das?
          </h2>
          <ul className="mt-10 grid gap-6 md:grid-cols-3">
            {recognitions.map((text) => (
              <li key={text} className="rounded-3xl border border-line bg-cream p-7 leading-relaxed text-cocoa">
                {text}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 3. Die Führerin */}
      <section className="mx-auto grid w-full max-w-6xl items-center gap-10 px-5 py-20 md:grid-cols-2 md:gap-16 md:py-28">
        <div className="overflow-hidden rounded-[2rem] bg-sand">
          <Image
            src={brand.portrait.src}
            alt={brand.portrait.alt}
            width={brand.portrait.width}
            height={brand.portrait.height}
            sizes="(min-width: 768px) 560px, 100vw"
            className="h-auto w-full"
          />
        </div>
        <div className="space-y-5 leading-relaxed text-cocoa">
          <h2 className="font-serif text-3xl leading-tight text-ink md:text-5xl">
            Du musst nicht raten. Filo schaut hin.
          </h2>
          <p>
            Filo ist deine Expertin für Korean Skincare in Pforzheim. Sie nimmt sich Zeit für deine Haut, bevor
            sie behandelt, und erklärt dir, was sie tut und warum.
          </p>
          <p>Das Ziel: eine Pflege, die zu dir passt, und die du auch zu Hause verstehst und fortführen kannst.</p>
          <Link href="/about" className="inline-block text-sm tracking-wide text-ink underline underline-offset-4 hover:text-cocoa">
            Filo kennenlernen
          </Link>
        </div>
      </section>

      {/* 4. Der Plan */}
      <section className="border-y border-line">
        <div className="mx-auto w-full max-w-6xl px-5 py-20 md:py-28">
          <h2 className="font-serif text-3xl text-ink md:text-5xl">So einfach geht&apos;s.</h2>
          <ol className="mt-12 grid gap-10 md:grid-cols-3">
            {steps.map((step, i) => (
              <li key={step.title}>
                <p className="font-serif text-5xl lining-nums text-caramel" aria-hidden="true">
                  {i + 1}
                </p>
                <h3 className="mt-3 text-lg text-ink">{step.title}</h3>
                <p className="mt-2 leading-relaxed text-cocoa">{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* 5. Behandlungen (aus der Datenbank) */}
      <section className="mx-auto w-full max-w-6xl px-5 py-20 md:py-28">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <h2 className="max-w-xl font-serif text-3xl leading-tight text-ink md:text-5xl">
            Das Studio bietet dir
          </h2>
          <Link href="/treatments" className="text-sm tracking-wide text-ink underline underline-offset-4 hover:text-cocoa">
            Alle Behandlungen und Preise
          </Link>
        </div>

        {catalog.ok && groups.length > 0 ? (
          <ul className="mt-10 grid gap-6 md:grid-cols-3">
            {groups.map(({ category, services }) => {
              const from = lowestPrice(services);
              return (
                <li key={category.id}>
                  <Link
                    href={`/treatments#${category.slug}`}
                    className="flex h-full flex-col rounded-3xl border border-line bg-sand/40 p-7 transition-colors hover:bg-sand/70"
                  >
                    <h3 className="font-serif text-2xl text-ink">{category.name}</h3>
                    <p className="mt-3 text-sm text-cocoa">
                      {services.length} {services.length === 1 ? "Behandlung" : "Behandlungen"}
                      {from !== null ? ` · ab ${formatPrice(from)}` : ""}
                    </p>
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="mt-10">
            <CatalogUnavailable />
          </div>
        )}
      </section>

      {/* 6. Aufruf zum Handeln */}
      <section className="bg-cocoa text-cream">
        <div className="mx-auto w-full max-w-6xl px-5 py-20 text-center md:py-28">
          <h2 className="mx-auto max-w-2xl font-serif text-3xl leading-tight md:text-5xl">
            Gönn deiner Haut den nächsten Schritt.
          </h2>
          <p className="mx-auto mt-5 max-w-md text-cream/80">
            {formatAddress()}
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link
              href="/book"
              className="inline-flex min-h-11 items-center justify-center rounded-full bg-cream px-7 py-3 text-sm tracking-wide text-ink transition-colors hover:bg-sand"
            >
              Termin buchen
            </Link>
            <a
              href={`tel:${brand.contact.phone.replace(/\s/g, "")}`}
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-cream/60 px-7 py-3 text-sm tracking-wide text-cream transition-colors hover:bg-cream/10"
            >
              Anrufen
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
