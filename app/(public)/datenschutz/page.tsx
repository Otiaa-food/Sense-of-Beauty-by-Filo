import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/public/PagePlaceholder";

export const metadata: Metadata = {
  title: "Datenschutz",
  alternates: { canonical: "/datenschutz" },
  robots: { index: false },
};

export default function DatenschutzPage() {
  return (
    <PagePlaceholder
      phase="Phase 3"
      title="Datenschutz"
      intro="Die Datenschutzerklärung wird vorbereitet und vor dem Livegang rechtlich geprüft."
    />
  );
}
