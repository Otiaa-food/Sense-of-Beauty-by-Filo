import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/public/PagePlaceholder";

export const metadata: Metadata = {
  title: "Behandlungen",
  description:
    "Korean Facial Care, Wimpern- und Augenbrauenpflege und weitere Behandlungen in Pforzheim.",
  alternates: { canonical: "/treatments" },
};

export default function TreatmentsPage() {
  return (
    <PagePlaceholder
      phase="Phase 3"
      title="Behandlungen"
      intro="Hier erscheinen Filos Behandlungen mit Dauer und Preis. Sie kommen aus der Datenbank und werden im Admin gepflegt."
    />
  );
}
