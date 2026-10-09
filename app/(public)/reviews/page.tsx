import type { Metadata } from "next";
import { PageIntro } from "@/components/public/PageIntro";
import { SocialGrid } from "@/components/public/SocialGrid";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { brand } from "@/lib/brand.config";

export const metadata: Metadata = {
  title: "Stimmen",
  description: "Was Kundinnen über Sense of Beauty by Filo sagen.",
  alternates: { canonical: "/reviews" },
};

// Es werden nur echte, freigegebene Bewertungen gezeigt (Phase 8). Bis dahin: Link zu Google.
export default function ReviewsPage() {
  return (
    <>
      <section className="mx-auto w-full max-w-3xl px-5 py-16 md:py-24">
        <PageIntro title="Das sagen Kundinnen">
          <p>Echte Bewertungen findest du auf Google. Dort schreiben Kundinnen unabhängig von uns, was sie erlebt haben.</p>
        </PageIntro>
        <div className="mt-10">
          <ButtonLink href={brand.contact.googleBusinessUrl} external>
            Bewertungen auf Google
          </ButtonLink>
        </div>
      </section>
      <SocialGrid />
    </>
  );
}
