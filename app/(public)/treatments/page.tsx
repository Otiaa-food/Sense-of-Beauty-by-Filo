import type { Metadata } from "next";
import { CatalogUnavailable } from "@/components/public/CatalogUnavailable";
import { TreatmentList } from "@/components/public/TreatmentList";
import { groupCatalog } from "@/lib/catalog";
import { getCatalog } from "@/lib/data/catalog";

export const metadata: Metadata = {
  title: "Behandlungen und Preise",
  description:
    "Korean Facials, Laserbehandlungen und Lashes in Pforzheim: alle Behandlungen mit Dauer und Preis. Jetzt online Termin buchen.",
  alternates: { canonical: "/treatments" },
};

export default async function TreatmentsPage() {
  const catalog = await getCatalog();
  const groups = groupCatalog(catalog.categories, catalog.services);

  return (
    <section className="mx-auto w-full max-w-4xl px-5 py-20 md:py-32">
      <h1 className="font-serif text-5xl font-light leading-[1.02] tracking-[-0.02em] text-ink md:text-8xl">
        Behandlungen
      </h1>
      <p className="mt-8 max-w-xl font-serif text-2xl font-light italic leading-snug text-cocoa">
        Du bist unsicher, welche die richtige ist? Bei den Korean Facials beginnt Filo mit einer Hautanalyse und
        empfiehlt dir danach, was zu deiner Haut passt.
      </p>

      <div className="mt-24">
        {catalog.ok && groups.length > 0 ? <TreatmentList groups={groups} /> : <CatalogUnavailable />}
      </div>
    </section>
  );
}
