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
    <section className="mx-auto w-full max-w-4xl px-5 py-16 md:py-24">
      <p className="text-xs uppercase tracking-[0.3em] text-cocoa">Behandlungen und Preise</p>
      <h1 className="mt-4 max-w-2xl font-serif text-4xl leading-tight text-ink md:text-6xl">
        Finde die Behandlung, die zu deiner Haut passt.
      </h1>
      <p className="mt-6 max-w-xl leading-relaxed text-cocoa">
        Du bist unsicher, welche Behandlung die richtige ist? Bei den Korean Facials beginnt Filo mit einer
        Hautanalyse und empfiehlt dir danach, was zu deiner Haut passt.
      </p>

      <div className="mt-16">
        {catalog.ok && groups.length > 0 ? <TreatmentList groups={groups} /> : <CatalogUnavailable />}
      </div>
    </section>
  );
}
