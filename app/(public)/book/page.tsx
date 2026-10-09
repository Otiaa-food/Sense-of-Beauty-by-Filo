import type { Metadata } from "next";
import { Suspense } from "react";
import { BookingFlow } from "@/components/booking/BookingFlow";
import { CatalogUnavailable } from "@/components/public/CatalogUnavailable";
import { PageIntro } from "@/components/public/PageIntro";
import { brand } from "@/lib/brand.config";
import { groupCatalog } from "@/lib/catalog";
import { getCatalog } from "@/lib/data/catalog";

export const metadata: Metadata = {
  title: "Termin buchen",
  description: "Buche deinen Termin bei Sense of Beauty by Filo online, in wenigen Schritten.",
  alternates: { canonical: "/book" },
};

export default async function BookPage() {
  const catalog = await getCatalog();
  // Online buchbar sind nur aktive Behandlungen ohne Zusatzleistungen
  const bookable = catalog.services.filter((s) => s.online_booking_enabled && !s.addon_only);
  const groups = groupCatalog(catalog.categories, bookable);

  return (
    <section className="mx-auto w-full max-w-4xl px-5 py-16 md:py-24">
      <PageIntro title="Termin buchen">
        <p>
          In drei Schritten zu deinem Termin. Kostenlos absagen kannst du bis {brand.booking.freeCancellationHours}{" "}
          Stunden vorher.
        </p>
      </PageIntro>
      <div className="mt-6">
        {catalog.ok && groups.length > 0 ? (
          <Suspense fallback={<p className="mt-10 text-muted">Wird geladen …</p>}>
            <BookingFlow groups={groups} phone={brand.contact.phone} />
          </Suspense>
        ) : (
          <div className="mt-10">
            <CatalogUnavailable />
          </div>
        )}
      </div>
    </section>
  );
}
