import Link from "next/link";
import { CatalogUnavailable } from "@/components/public/CatalogUnavailable";
import { Hero } from "@/components/public/Hero";
import { PhotoFill } from "@/components/public/PhotoFill";
import { SocialGrid } from "@/components/public/SocialGrid";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { brand, mapsDirectionsUrl } from "@/lib/brand.config";
import { formatPrice, groupCatalog, lowestPrice } from "@/lib/catalog";
import { getCatalog } from "@/lib/data/catalog";
import { categoryPhotos, homeStrip, photos } from "@/lib/media";

const steps = [
  {
    title: "Termin online buchen",
    text: "Such dir Behandlung und Wunschzeit aus. Du bekommst sofort deine Bestätigung per E-Mail.",
  },
  {
    title: "Hautanalyse im Studio",
    text: "Bei den Korean Facials schaut sich Filo zuerst deine Haut an und stimmt die Behandlung darauf ab.",
  },
  {
    title: "Behandlung und Pflege-Tipps",
    text: "Du wirst in Ruhe behandelt und gehst mit klaren Tipps für deine Pflege zu Hause nach Hause.",
  },
];

export default async function HomePage() {
  const catalog = await getCatalog();
  const groups = catalog.ok ? groupCatalog(catalog.categories, catalog.services) : [];

  return (
    <>
      <Hero />

      {/* Satz im Farbblock (Problem und Einfühlung) */}
      <section className="bg-taupe px-5 py-20 text-center text-white md:py-28">
        <p className="mx-auto max-w-3xl text-[1.35rem] font-light leading-relaxed md:text-[1.75rem]">
          Deine Haut wirkt müde und fahl, obwohl du sie pflegst? Gute Hautpflege beginnt damit, dass jemand genau
          hinschaut und dir sagt, was deine Haut wirklich braucht.
        </p>
      </section>

      {/* Über Filo: Farbfläche mit gesperrtem Titel, daneben Portrait */}
      <section className="mx-auto grid max-w-7xl gap-1.5 px-1.5 pt-1.5 md:grid-cols-2">
        <div className="flex flex-col justify-center bg-stone px-7 py-14 md:px-14 md:py-20">
          <h2 className="text-3xl font-light tracking-[0.16em] text-espresso md:text-4xl">Über Filo</h2>
          <div className="mt-7 space-y-4 text-[0.98rem] leading-[1.85] text-muted">
            <p>
              Ich bin Filo, Kosmetikerin und Inhaberin von {brand.fullName} in {brand.address.city}. Mein Schwerpunkt
              ist Korean Skincare: Wirkstoffkosmetik nach koreanischem Vorbild, abgestimmt auf deine Haut.
            </p>
            <p>
              Bevor ich behandle, schaue ich mir deine Haut genau an. Danach weißt du, was sie braucht, und auch, was
              nicht.
            </p>
          </div>
          <div className="mt-9">
            <ButtonLink href="/about" variant="outline">
              Mehr über Filo
            </ButtonLink>
          </div>
        </div>
        <div className="relative aspect-[4/5] md:aspect-auto md:min-h-[36rem]">
          <PhotoFill photo={photos.filoPortrait} sizes="(min-width: 768px) 50vw, 100vw" />
        </div>
      </section>

      {/* Studioadresse auf Foto mit hellem Schleier */}
      <section className="mx-auto max-w-7xl px-1.5 pt-1.5">
        <div className="relative isolate flex min-h-[26rem] items-center md:min-h-[32rem]">
          <div className="absolute inset-0 -z-20">
            <PhotoFill photo={photos.studioFlur} sizes="100vw" />
          </div>
          <div aria-hidden="true" className="absolute inset-0 -z-10 bg-white/70" />
          <div className="px-7 py-14 md:px-14">
            <h2 className="text-3xl font-light tracking-[0.16em] text-espresso md:text-4xl">Studioadresse</h2>
            <address className="mt-6 text-[1.05rem] not-italic leading-relaxed text-espresso">
              {brand.fullName}
              <br />
              {brand.address.street}, {brand.address.detail}
              <br />
              {brand.address.zip} {brand.address.city}
            </address>
            <div className="mt-8">
              <ButtonLink href={mapsDirectionsUrl()} external>
                Route anzeigen
              </ButtonLink>
            </div>
          </div>
        </div>
      </section>

      {/* Korean Skincare mit Bildstreifen */}
      <section className="mx-auto max-w-7xl px-5 pb-6 pt-20 md:px-8 md:pt-28">
        <div className="max-w-2xl">
          <h2 className="text-[2.2rem] font-light leading-tight text-espresso md:text-5xl">Korean Skincare in {brand.address.city}</h2>
          <p className="mt-6 text-[0.98rem] leading-[1.85] text-muted">
            Inspiriert von der Hautpflege aus Südkorea arbeitet Filo mit hochwertigen Wirkstoffen und Ampullen. Jede
            Behandlung wird individuell auf dich und deinen Hautzustand abgestimmt.
          </p>
          <div className="mt-8">
            <ButtonLink href="/treatments">Behandlungen</ButtonLink>
          </div>
        </div>
      </section>
      <div className="mx-auto grid max-w-7xl grid-cols-3 gap-1.5 px-1.5 pt-8">
        {homeStrip.map((p) => (
          <div key={p.src} className="relative aspect-[4/5]">
            <PhotoFill photo={p} sizes="33vw" />
          </div>
        ))}
      </div>

      {/* So läuft dein Termin (echte Abfolge, daher nummeriert) */}
      <section className="mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-28">
        <h2 className="text-[2.2rem] font-light leading-tight text-espresso md:text-5xl">So läuft dein Termin</h2>
        <ol className="mt-12 grid gap-10 md:grid-cols-3">
          {steps.map((step, i) => (
            <li key={step.title} className="border-t border-espresso/20 pt-6">
              <p className="text-5xl font-extralight text-taupe" aria-hidden="true">
                {i + 1}
              </p>
              <h3 className="mt-5 text-lg font-normal text-espresso">{step.title}</h3>
              <p className="mt-2 text-[0.95rem] leading-[1.8] text-muted">{step.text}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Behandlungen mit Foto je Kategorie */}
      <section className="bg-white py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <h2 className="text-[2.2rem] font-light leading-tight text-espresso md:text-5xl">Behandlungen & Preise</h2>
        </div>
        {groups.length > 0 ? (
          <ul className="mx-auto mt-12 grid max-w-7xl gap-1.5 px-1.5 md:grid-cols-3">
            {groups.map(({ category, services }) => {
              const from = lowestPrice(services);
              const photo = categoryPhotos[category.slug];
              return (
                <li key={category.id}>
                  <Link href={`/treatments#${category.slug}`} className="group block">
                    <div className="relative aspect-[4/5] overflow-hidden bg-stone">
                      {photo ? <PhotoFill photo={photo} sizes="(min-width: 768px) 33vw, 100vw" /> : null}
                    </div>
                    <div className="px-4 pb-4 pt-5 md:px-2">
                      <h3 className="text-xl font-light uppercase tracking-[0.08em] text-espresso group-hover:text-taupe">
                        {category.name}
                      </h3>
                      <p className="mt-1 text-sm text-muted">
                        {services.length} {services.length === 1 ? "Behandlung" : "Behandlungen"}
                        {from !== null ? `, ab ${formatPrice(from)}` : ""}
                      </p>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="mx-auto mt-12 max-w-7xl px-5 md:px-8">
            <CatalogUnavailable />
          </div>
        )}
      </section>

      <SocialGrid />
    </>
  );
}
