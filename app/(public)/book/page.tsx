import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/public/PagePlaceholder";

export const metadata: Metadata = {
  title: "Termin buchen",
  description: "Buche deinen Termin bei Sense of Beauty by Filo online, in wenigen Schritten.",
  alternates: { canonical: "/book" },
};

export default function BookPage() {
  return (
    <PagePlaceholder
      phase="Phase 4"
      title="Termin buchen"
      intro="Hier entsteht der Buchungsablauf: Behandlung wählen, Datum und Uhrzeit wählen, Daten eingeben, fertig."
    />
  );
}
