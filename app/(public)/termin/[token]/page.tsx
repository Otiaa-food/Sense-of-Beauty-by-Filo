import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { brand, mapsDirectionsUrl } from "@/lib/brand.config";
import { formatDuration, formatPrice } from "@/lib/catalog";
import { canCancel, loadByToken } from "@/lib/booking/manage";
import { bookingConfigured } from "@/lib/booking/server";
import { cancelAppointment } from "./actions";

export const metadata: Metadata = {
  title: "Dein Termin",
  robots: { index: false, follow: false },
};

type Props = {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ neu?: string; storno?: string }>;
};

export default function AppointmentPage(props: Props) {
  return (
    <section className="mx-auto w-full max-w-2xl px-5 py-16 md:py-24">
      <Suspense fallback={<p className="text-muted">Termin wird geladen …</p>}>
        <AppointmentDetails {...props} />
      </Suspense>
    </section>
  );
}

async function AppointmentDetails({ params, searchParams }: Props) {
  const { token } = await params;
  const { neu, storno } = await searchParams;
  if (!bookingConfigured()) notFound();
  const appt = await loadByToken(token);
  if (!appt) notFound();

  const tz = brand.timezone;
  const start = new Date(appt.start_time);
  const day = new Intl.DateTimeFormat("de-DE", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: tz }).format(start);
  const time = new Intl.DateTimeFormat("de-DE", { hour: "2-digit", minute: "2-digit", timeZone: tz }).format(start);
  const minutes = Math.round((Date.parse(appt.end_time) - start.getTime()) / 60000);
  const cancelled = appt.status === "cancelled";
  const tel = brand.contact.phone.replace(/\s/g, "");

  return (
    <>
      <h1 className="text-[2.4rem] font-light leading-tight text-espresso md:text-5xl">
        {cancelled ? "Dein Termin ist abgesagt" : neu ? `Danke${appt.firstName ? `, ${appt.firstName}` : ""}! Dein Termin steht.` : "Dein Termin"}
      </h1>
      {storno === "too_late" ? (
        <p role="alert" className="mt-6 border border-line bg-white p-4 text-muted">
          Online absagen geht nur bis {brand.booking.freeCancellationHours} Stunden vorher. Bitte ruf im Studio an.
        </p>
      ) : null}
      {neu && !cancelled ? (
        <p className="mt-6 leading-relaxed text-muted">
          Speichere dir diese Seite als Lesezeichen. Über sie kannst du deinen Termin später ansehen oder absagen.
        </p>
      ) : null}

      <dl className="mt-10 divide-y divide-line border-y border-line">
        {[
          ["Behandlung", appt.serviceName],
          ["Datum", day],
          ["Uhrzeit", `${time} Uhr (${formatDuration(minutes)})`],
          ["Preis", formatPrice(appt.price)],
          ["Ort", `${brand.address.street}, ${brand.address.detail}, ${brand.address.zip} ${brand.address.city}`],
        ].map(([k, v]) => (
          <div key={k} className="grid grid-cols-[7rem_1fr] gap-4 py-4">
            <dt className="label pt-0.5 text-muted">{k}</dt>
            <dd className={`text-espresso ${cancelled ? "line-through decoration-espresso/40" : ""}`}>{v}</dd>
          </div>
        ))}
      </dl>

      {!cancelled ? (
        <div className="mt-10 flex flex-wrap gap-3">
          <ButtonLink href={mapsDirectionsUrl()} external>
            Route anzeigen
          </ButtonLink>
          {canCancel(appt) ? (
            <details className="group">
              <summary className="label inline-flex min-h-12 cursor-pointer list-none items-center border border-espresso px-7 text-espresso transition-colors hover:bg-espresso hover:text-white [&::-webkit-details-marker]:hidden">
                Termin absagen
              </summary>
              <form action={cancelAppointment} className="mt-4 border border-line bg-white p-5">
                <p className="text-muted">Möchtest du diesen Termin wirklich absagen?</p>
                <input type="hidden" name="token" value={token} />
                <button type="submit" className="label mt-4 inline-flex min-h-12 items-center bg-espresso px-7 text-white hover:bg-taupe">
                  Ja, Termin absagen
                </button>
              </form>
            </details>
          ) : (
            <p className="w-full text-sm text-muted">
              Kurzfristig verhindert? Bitte ruf an:{" "}
              <a href={`tel:${tel}`} className="text-espresso underline underline-offset-4">{brand.contact.phone}</a>
            </p>
          )}
        </div>
      ) : (
        <div className="mt-10">
          <ButtonLink href="/book">Neuen Termin buchen</ButtonLink>
        </div>
      )}
    </>
  );
}
