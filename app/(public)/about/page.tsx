import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/public/PagePlaceholder";

export const metadata: Metadata = {
  title: "Über Filo",
  description: "Lerne Filo kennen, deine Kosmetikerin für Korean Skincare in Pforzheim.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <PagePlaceholder
      phase="Phase 3"
      title="Über Filo"
      intro="Filos Geschichte und Ausbildung folgen, sobald sie die Texte und Fotos geliefert hat."
    />
  );
}
