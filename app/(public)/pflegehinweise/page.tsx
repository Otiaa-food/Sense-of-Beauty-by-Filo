import type { Metadata } from "next";
import { PageIntro } from "@/components/public/PageIntro";

export const metadata: Metadata = {
  title: "Pflegehinweise",
  description: "Was du vor und nach deiner Behandlung beachten solltest.",
  alternates: { canonical: "/pflegehinweise" },
};

// ENTWURF: allgemeine Hinweise, von Filo fachlich zu prüfen und je Behandlung zu ergänzen.
const before = [
  "Komm bitte ohne Make-up zur Gesichtsbehandlung.",
  "Verzichte in den Tagen vorher auf Peelings und Solarium.",
  "Vermeide Sonnenbrand vor dem Termin.",
  "Sag Filo vorab, wenn du Medikamente nimmst oder deine Haut gerade gereizt ist.",
];
const after = [
  "Gönn deiner Haut nach der Behandlung Ruhe, am besten ohne Make-up.",
  "Meide in den ersten Tagen Sauna, Solarium und starke Hitze.",
  "Verwende eine milde Pflege und versorge deine Haut mit viel Feuchtigkeit.",
  "Trag täglich Sonnenschutz auf.",
];

export default function CarePage() {
  return (
    <section className="mx-auto w-full max-w-3xl px-5 py-16 md:py-24">
      <p className="label border border-line bg-white px-4 py-3 text-muted">Entwurf, wird von Filo geprüft</p>
      <div className="mt-8">
        <PageIntro title="Pflegehinweise">
          <p>
            Damit deine Haut optimal vorbereitet ist und sich danach in Ruhe erholen kann, beachte bitte diese
            Hinweise. Bei Fragen ruf gerne an.
          </p>
        </PageIntro>
      </div>

      <h2 className="mt-14 text-2xl font-light text-espresso">Vor der Behandlung</h2>
      <ul className="mt-5 divide-y divide-line border-y border-line">
        {before.map((t) => (
          <li key={t} className="py-4 text-[0.98rem] leading-relaxed text-muted">{t}</li>
        ))}
      </ul>

      <h2 className="mt-14 text-2xl font-light text-espresso">Nach der Behandlung</h2>
      <ul className="mt-5 divide-y divide-line border-y border-line">
        {after.map((t) => (
          <li key={t} className="py-4 text-[0.98rem] leading-relaxed text-muted">{t}</li>
        ))}
      </ul>
    </section>
  );
}
