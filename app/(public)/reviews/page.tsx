import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/public/PagePlaceholder";

export const metadata: Metadata = {
  title: "Stimmen",
  description: "Was Kundinnen über Sense of Beauty by Filo sagen.",
  alternates: { canonical: "/reviews" },
};

export default function ReviewsPage() {
  return (
    <PagePlaceholder
      phase="Phase 3 und 8"
      title="Stimmen"
      intro="Es werden nur echte, freigegebene Bewertungen gezeigt. Wir erfinden keine."
    />
  );
}
