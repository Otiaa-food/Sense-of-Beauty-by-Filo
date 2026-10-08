import type { Metadata } from "next";
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
    <section className="mx-auto w-full max-w-3xl px-5 py-16 md:py-24">
      <p className="text-xs uppercase tracking-[0.3em] text-cocoa">Stimmen</p>
      <h1 className="mt-4 font-serif text-4xl leading-tight text-ink md:text-6xl">
        Das sagen Kundinnen.
      </h1>
      <p className="mt-8 max-w-xl text-lg leading-relaxed text-cocoa">
        Echte Bewertungen findest du auf Google. Dort schreiben Kundinnen unabhängig von uns, was sie erlebt haben.
      </p>
      <div className="mt-10">
        <ButtonLink href={brand.contact.googleBusinessUrl} external>
          Bewertungen auf Google lesen
        </ButtonLink>
      </div>
    </section>
  );
}
