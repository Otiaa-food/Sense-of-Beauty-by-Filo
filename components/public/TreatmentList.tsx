import Link from "next/link";
import { formatDuration, formatPrice, type CatalogGroup } from "@/lib/catalog";

/** Alle Behandlungen, nach Kategorie gruppiert, im Stil einer Karte: Name links, Preis rechts. */
export function TreatmentList({ groups }: { groups: CatalogGroup[] }) {
  return (
    <div className="space-y-28">
      {groups.map(({ category, services }) => (
        <section key={category.id} id={category.slug} aria-labelledby={`h-${category.slug}`} className="scroll-mt-24">
          <h2 id={`h-${category.slug}`} className="font-serif text-4xl font-light text-ink md:text-6xl">
            {category.name}
          </h2>
          {category.description ? (
            <p className="mt-5 max-w-2xl font-serif text-xl italic leading-relaxed text-cocoa">{category.description}</p>
          ) : null}

          <ul className="mt-10 divide-y divide-line border-y border-line">
            {services.map((s) => (
              <li key={s.id} className="grid grid-cols-[1fr_auto] items-start gap-x-6 gap-y-2 py-6">
                <div className="min-w-0">
                  <h3 className="text-[1.05rem] leading-snug text-ink">{s.name}</h3>
                  <p className="mt-1.5 text-sm text-cocoa">{formatDuration(s.duration_minutes)}</p>
                  {s.description ? <p className="mt-1 text-sm text-cocoa">{s.description}</p> : null}
                </div>
                <div className="text-right">
                  <p className="font-serif text-3xl font-light lining-nums leading-none text-ink">{formatPrice(s.price)}</p>
                  {s.online_booking_enabled && !s.addon_only ? (
                    <Link
                      href={`/book?service=${s.slug}`}
                      className="mt-2 inline-flex min-h-11 items-center border-b border-ink/30 text-sm text-ink transition-colors hover:border-ink"
                    >
                      Buchen
                    </Link>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
