import Image from "next/image";
import Link from "next/link";
import { CatalogUnavailable } from "@/components/public/CatalogUnavailable";
import { Hero } from "@/components/public/Hero";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { brand } from "@/lib/brand.config";
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
  const tel = brand.contact.phone.replace(/\s/g, "");

  return (
    <>
      <Hero groups={catalog.ok ? groups : []} />

      {/* Das Problem: ruhig, als Sätze, nicht als Karten */}
      <section className="mx-auto grid w-full max-w-6xl gap-10 px-5 py-24 md:grid-cols-[1fr_1.6fr] md:gap-20 md:py-36">
        <h2 className="font-serif text-4xl font-light italic leading-tight text-ink md:text-5xl">Kennst du das?</h2>
        <ul className="divide-y divide-line border-y border-line">
          {recognitions.map((text) => (
            <li key={text} className="py-7 font-serif text-2xl font-light leading-snug text-ink md:py-9 md:text-[1.9rem]">
              {text}
            </li>
          ))}
        </ul>
      </section>

      {/* Die Führerin: Portrait im Bogen */}
      <section className="bg-sand/50">
        <div className="mx-auto grid w-full max-w-6xl items-center gap-12 px-5 py-24 md:grid-cols-2 md:gap-24 md:py-36">
          <div className="mx-auto w-full max-w-md overflow-hidden rounded-t-[999px] bg-sand">
            <Image
              src={brand.portrait.src}
              alt={brand.portrait.alt}
              width={brand.portrait.width}
              height={brand.portrait.height}
              sizes="(min-width: 768px) 448px, 100vw"
              className="aspect-[4/5] h-auto w-full object-cover object-top"
            />
          </div>
          <div>
            <h2 className="font-serif text-4xl font-light leading-[1.08] text-ink md:text-6xl">
              Du musst nicht raten. Filo schaut hin.
            </h2>
            <div className="mt-8 max-w-md space-y-5 text-[1.05rem] font-[350] leading-8 text-cocoa">
              <p>
                Filo ist deine Expertin für Korean Skincare in Pforzheim. Sie nimmt sich Zeit für deine Haut, bevor
                sie behandelt, und erklärt dir, was sie tut und warum.
              </p>
              <p>Das Ziel: eine Pflege, die zu dir passt, und die du auch zu Hause verstehst und fortführen kannst.</p>
            </div>
            <div className="mt-8">
              <ButtonLink href="/about" variant="secondary">
                Filo kennenlernen
              </ButtonLink>
            </div>
          </div>
        </div>
      </section>

      {/* Der Plan: dunkle Fläche für Rhythmus. Hier ist es eine echte Abfolge, daher nummeriert. */}
      <section className="bg-espresso text-cream">
        <div className="mx-auto w-full max-w-6xl px-5 py-24 md:py-36">
          <h2 className="font-serif text-4xl font-light md:text-6xl">So einfach geht&apos;s.</h2>
          <ol className="mt-16 grid gap-12 md:grid-cols-3 md:gap-10">
            {steps.map((step, i) => (
              <li key={step.title} className="border-t border-cream/20 pt-6">
                <p className="font-serif text-6xl font-light lining-nums text-caramel" aria-hidden="true">
                  {i + 1}
                </p>
                <h3 className="mt-6 font-serif text-2xl text-cream">{step.title}</h3>
                <p className="mt-3 max-w-xs text-[0.98rem] font-[350] leading-7 text-cream/75">{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Behandlungen: wie eine Karte im Restaurant, aus der Datenbank */}
      <section className="mx-auto w-full max-w-6xl px-5 py-24 md:py-36">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <h2 className="max-w-xl font-serif text-4xl font-light leading-tight text-ink md:text-6xl">
            Das Studio bietet dir
          </h2>
          <ButtonLink href="/treatments" variant="secondary">
            Alle Behandlungen und Preise
          </ButtonLink>
        </div>

        {catalog.ok && groups.length > 0 ? (
          <ul className="mt-14 divide-y divide-line border-y border-line">
            {groups.map(({ category, services }) => {
              const from = lowestPrice(services);
              return (
                <li key={category.id}>
                  <Link
                    href={`/treatments#${category.slug}`}
                    className="group flex flex-col gap-2 py-8 sm:flex-row sm:items-baseline sm:justify-between sm:gap-8 md:py-10"
                  >
                    <span className="font-serif text-3xl font-light text-ink transition-colors group-hover:text-caramel md:text-5xl">
                      {category.name}
                    </span>
                    <span className="text-[0.95rem] text-cocoa">
                      {services.length} {services.length === 1 ? "Behandlung" : "Behandlungen"}
                      {from !== null ? `, ab ${formatPrice(from)}` : ""}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="mt-14">
            <CatalogUnavailable />
          </div>
        )}
      </section>

      {/* Aufruf zum Handeln */}
      <section className="bg-sand/50">
        <div className="mx-auto w-full max-w-4xl px-5 py-24 text-center md:py-36">
          <h2 className="font-serif text-4xl font-light leading-tight text-ink md:text-6xl">
            Gönn deiner Haut den nächsten Schritt.
          </h2>
          <p className="mx-auto mt-6 max-w-md font-[350] leading-8 text-cocoa">
            {brand.address.street}, {brand.address.detail}, {brand.address.zip} {brand.address.city}
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
            <ButtonLink href="/book">Termin buchen</ButtonLink>
            <ButtonLink href={`tel:${tel}`} variant="secondary" external>
              {brand.contact.phone}
            </ButtonLink>
          </div>
        </div>
      </section>
    </>
  );
}
