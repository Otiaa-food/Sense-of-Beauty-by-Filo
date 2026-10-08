import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/public/PagePlaceholder";

export const metadata: Metadata = {
  title: "Impressum",
  alternates: { canonical: "/impressum" },
  robots: { index: false },
};

export default function ImpressumPage() {
  return (
    <PagePlaceholder
      phase="Phase 3"
      title="Impressum"
      intro="Der rechtlich geprüfte Text wird mit Filos Angaben ergänzt, bevor die Seite live geht. Pflichtangaben liefert Filo."
    />
  );
}
