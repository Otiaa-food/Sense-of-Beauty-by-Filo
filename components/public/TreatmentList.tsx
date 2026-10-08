import { ButtonLink } from "@/components/ui/ButtonLink";
import { formatDuration, formatPrice, type CatalogGroup } from "@/lib/catalog";

/** Alle Behandlungen, nach Kategorie gruppiert. */
export function TreatmentList({ groups }: { groups: CatalogGroup[] }) {
  return (
    <div className="space-y-20">
      {groups.map(({ category, services }) => (
        <section key={category.id} id={category.slug} aria-labelledby={`h-${category.slug}`} className="scroll-mt-24">
          <h2 id={`h-${category.slug}`} className="font-serif text-3xl text-ink md:text-4xl">
            {category.name}
          </h2>
          {category.description ? (
            <p className="mt-4 max-w-2xl leading-relaxed text-cocoa">{category.description}</p>
          ) : null}

          <ul className="mt-8 divide-y divide-line border-y border-line">
            {services.map((s) => (
              <li key={s.id} className="flex flex-col gap-3 py-5 sm:flex-row sm:items-center sm:justify-between sm:gap-8">
                <div className="min-w-0">
                  <h3 className="text-base text-ink md:text-lg">{s.name}</h3>
                  <p className="mt-1 text-sm text-cocoa">
                    {formatDuration(s.duration_minutes)}
                    {s.description ? ` · ${s.description}` : ""}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-5">
                  <p className="font-serif text-2xl lining-nums text-ink">{formatPrice(s.price)}</p>
                  {s.online_booking_enabled && !s.addon_only ? (
                    <ButtonLink href={`/book?service=${s.slug}`} variant="secondary">
                      Buchen
                    </ButtonLink>
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
