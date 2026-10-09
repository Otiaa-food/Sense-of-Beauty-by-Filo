import Link from "next/link";
import { PhotoFill } from "@/components/public/PhotoFill";
import { brand } from "@/lib/brand.config";
import { formatDuration, formatPrice, type CatalogGroup } from "@/lib/catalog";
import { categoryPhotos } from "@/lib/media";

/**
 * Behandlungen als dunkle Karten je Kategorie (wie die Behandlungskarten bei Lumo):
 * Name, Beschreibung, Preisliste, darunter ein Foto.
 */
export function TreatmentList({ groups }: { groups: CatalogGroup[] }) {
  return (
    <div className="space-y-8 md:space-y-12">
      {groups.map(({ category, services }) => {
        const photo = categoryPhotos[category.slug];
        return (
          <section
            key={category.id}
            id={category.slug}
            aria-labelledby={`h-${category.slug}`}
            className="scroll-mt-24 bg-espresso text-white"
          >
            <div className="px-6 pb-8 pt-10 md:px-12 md:pt-14">
              <p className="label text-white/60">{brand.name}</p>
              <h2 id={`h-${category.slug}`} className="mt-3 break-words text-2xl font-light uppercase tracking-[0.06em] [hyphens:auto] sm:text-3xl md:text-4xl md:tracking-[0.08em]">
                {category.name}
              </h2>
              {category.description ? (
                <p className="mt-5 max-w-2xl text-[0.95rem] leading-relaxed text-white/75">{category.description}</p>
              ) : null}

              <ul className="mt-8 divide-y divide-white/15 border-y border-white/15">
                {services.map((s) => (
                  <li key={s.id} className="grid grid-cols-[1fr_auto] items-start gap-x-6 py-5">
                    <div className="min-w-0">
                      <h3 className="text-[0.98rem] font-normal leading-snug">{s.name}</h3>
                      <p className="mt-1 text-[0.82rem] text-white/60">
                        {formatDuration(s.duration_minutes)}
                        {s.description ? <span className="block">{s.description}</span> : null}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="whitespace-nowrap text-lg font-light">{formatPrice(s.price)}</p>
                      {s.online_booking_enabled && !s.addon_only ? (
                        <Link
                          href={`/book?service=${s.slug}`}
                          className="label mt-1 inline-flex min-h-11 items-center !text-[0.65rem] text-white/80 underline decoration-white/30 underline-offset-4 hover:text-white"
                        >
                          Buchen
                        </Link>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            {photo ? (
              <div className="relative aspect-[16/9] w-full">
                <PhotoFill photo={photo} sizes="(min-width: 768px) 768px, 100vw" />
              </div>
            ) : null}
          </section>
        );
      })}
    </div>
  );
}
