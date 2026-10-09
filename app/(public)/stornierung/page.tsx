import type { Metadata } from "next";
import { PageIntro } from "@/components/public/PageIntro";
import { brand } from "@/lib/brand.config";

export const metadata: Metadata = {
  title: "Stornierung",
  description: "So kannst du deinen Termin absagen oder verschieben.",
  alternates: { canonical: "/stornierung" },
};

export default function CancellationPage() {
  const tel = brand.contact.phone.replace(/\s/g, "");
  const hours = brand.booking.freeCancellationHours;
  return (
    <section className="mx-auto w-full max-w-3xl px-5 py-16 md:py-24">
      <PageIntro title="Termin absagen">
        <p>
          Bis {hours} Stunden vor deinem Termin kannst du kostenlos absagen. Den Link dazu findest du in deiner
          Bestätigungs-E-Mail.
        </p>
      </PageIntro>

      <h2 className="mt-14 text-2xl font-light text-espresso">Kurzfristig verhindert?</h2>
      <p className="mt-4 text-[0.98rem] leading-[1.85] text-muted">
        Wenn es weniger als {hours} Stunden bis zu deinem Termin sind, ruf bitte im Studio an:{" "}
        <a href={`tel:${tel}`} className="text-espresso underline underline-offset-4">
          {brand.contact.phone}
        </a>
        . So kann Filo die Zeit vielleicht noch an jemand anderen vergeben.
      </p>

      <h2 className="mt-14 text-2xl font-light text-espresso">Verspätung</h2>
      <p className="mt-4 text-[0.98rem] leading-[1.85] text-muted">
        Gib bitte kurz telefonisch Bescheid, wenn du dich verspätest. Damit die nächste Kundin nicht warten muss, kann
        sich deine Behandlungszeit dann verkürzen.
      </p>
    </section>
  );
}
