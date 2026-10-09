import type { Metadata } from "next";
import { CatalogUnavailable } from "@/components/public/CatalogUnavailable";
import { PageIntro } from "@/components/public/PageIntro";
import { SocialGrid } from "@/components/public/SocialGrid";
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
    <>
      <section className="mx-auto w-full max-w-3xl px-5 pb-12 pt-16 md:pt-24">
        <PageIntro title="Behandlungen & Preise">
          <p>
            Du bist unsicher, welche Behandlung die richtige ist? Bei den Korean Facials beginnt Filo mit einer
            Hautanalyse und empfiehlt dir danach, was zu deiner Haut passt.
          </p>
        </PageIntro>
      </section>
      <div className="mx-auto w-full max-w-3xl px-1.5 sm:px-5">
        {catalog.ok && groups.length > 0 ? <TreatmentList groups={groups} /> : <CatalogUnavailable />}
      </div>
      <SocialGrid />
    </>
  );
}
