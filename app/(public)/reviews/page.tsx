import type { Metadata } from "next";
import { PageIntro } from "@/components/public/PageIntro";
import { ReviewQuotes, ReviewSummaryRow } from "@/components/public/Reviews";
import { SocialGrid } from "@/components/public/SocialGrid";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { brand } from "@/lib/brand.config";
import { getReviews } from "@/lib/data/reviews";

export const metadata: Metadata = {
  title: "Stimmen",
  description: "Was Kundinnen über Sense of Beauty by Filo sagen.",
  alternates: { canonical: "/reviews" },
};

// Nur echte Bewertungen: Zitate erscheinen erst mit Einwilligung der Kundin (siehe Datenbank-Regel).
export default async function ReviewsPage() {
  const { reviews, summary } = await getReviews();
  return (
    <>
      <section className="mx-auto w-full max-w-7xl px-5 pb-10 pt-16 md:px-8 md:pt-24">
        <PageIntro title="Das sagen Kundinnen">
          <p>Echte Erfahrungen von Kundinnen, die bei Filo waren. Auf Google und Planity kannst du alle Bewertungen nachlesen.</p>
        </PageIntro>
      </section>
      <div className="mx-auto max-w-7xl space-y-1.5 px-1.5 sm:px-5 md:px-8">
        <ReviewSummaryRow summary={summary} googleUrl={brand.contact.googleBusinessUrl} />
        <ReviewQuotes reviews={reviews} />
      </div>
      <section className="mx-auto max-w-7xl px-5 py-14 md:px-8">
        <h2 className="text-2xl font-light text-espresso">Du warst schon bei Filo?</h2>
        <p className="mt-3 max-w-xl leading-[1.8] text-muted">Erzähl auf Google in ein, zwei Sätzen, wie du deine Behandlung erlebt hast. Das hilft anderen bei der Entscheidung.</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <ButtonLink href={brand.contact.googleBusinessUrl} external>Bewertung schreiben</ButtonLink>
          <ButtonLink href="/book" variant="outline">Termin buchen</ButtonLink>
        </div>
      </section>
      <SocialGrid />
    </>
  );
}
