"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { createBooking, joinWaitlist } from "@/app/(public)/book/actions";
import { addMonths, formatDay, formatMonth, monthGrid, monthKey } from "@/components/booking/calendar";
import { formatDuration, formatPrice, type CatalogGroup, type CatalogService } from "@/lib/catalog";
import type { BookingFormState } from "@/lib/booking/schema";
import { waitlistWindows, type WaitlistFormState } from "@/lib/waitlist";

type Slot = { start: string; label: string };
type Loadable<T> = { state: "idle" | "loading" | "error"; data?: T; error?: string };

const weekdays = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

/**
 * Buchungsablauf in drei Schritten: Behandlung → Tag und Uhrzeit → Daten.
 * Die gewählte Behandlung steht in der Adresse (?service=…), so funktionieren Links von der Preisliste
 * und der Zurück-Knopf des Browsers.
 */
export function BookingFlow({ groups, phone, cancelHours }: { groups: CatalogGroup[]; phone: string; cancelHours: number }) {
  const router = useRouter();
  const params = useSearchParams();
  const slug = params.get("service");
  // ?tag=2026-11-13 aus der Wartelisten-Nachricht: diesen Tag gleich öffnen
  const tag = params.get("tag");
  const [tagMissed, setTagMissed] = useState<string | null>(null);

  const services = useMemo(() => groups.flatMap((g) => g.services), [groups]);
  const service = services.find((s) => s.slug === slug) ?? null;

  const [days, setDays] = useState<Loadable<{ days: string[]; firstDay: string }>>({ state: slug ? "loading" : "idle" });
  const [day, setDay] = useState<string | null>(null);
  const [month, setMonth] = useState<string | null>(null);
  const [slots, setSlots] = useState<Loadable<Slot[]>>({ state: "idle" });
  const [slot, setSlot] = useState<Slot | null>(null);

  // Bei jedem Schrittwechsel an den Anfang des Ablaufs scrollen (wichtig am Handy)
  const topRef = useRef<HTMLDivElement>(null);
  const slotsRef = useRef<HTMLDivElement>(null);
  const step = !service ? 1 : slot ? 3 : 2;
  const firstStep = useRef(true);
  useEffect(() => {
    if (firstStep.current) {
      firstStep.current = false;
      return;
    }
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [step]);

  // Behandlung gewechselt: Tage neu laden, Auswahl zurücksetzen
  const [lastSlug, setLastSlug] = useState(slug);
  if (slug !== lastSlug) {
    setLastSlug(slug);
    setDay(null);
    setSlot(null);
    setSlots({ state: "idle" });
    setDays({ state: slug ? "loading" : "idle" });
  }

  useEffect(() => {
    if (!service) return;
    let cancelled = false;
    fetch(`/api/availability?service=${service.slug}`)
      .then(async (r) => {
        const body = await r.json();
        if (!r.ok) throw new Error(body.error ?? "server_error");
        return body as { days: string[]; firstDay: string };
      })
      .then((data) => {
        if (cancelled) return;
        setDays({ state: "idle", data });
        const wanted = tag && /^\d{4}-\d{2}-\d{2}$/.test(tag) ? tag : null;
        if (wanted && data.days.includes(wanted)) {
          setMonth(monthKey(wanted));
          setDay(wanted);
          setSlots({ state: "loading" });
          fetch(`/api/availability?service=${service.slug}&day=${wanted}`)
            .then(async (r) => {
              const body = await r.json();
              if (!r.ok) throw new Error(body.error ?? "server_error");
              if (!cancelled) setSlots({ state: "idle", data: body.slots as Slot[] });
            })
            .catch((e: Error) => !cancelled && setSlots({ state: "error", error: e.message }));
        } else {
          setMonth(monthKey(data.days[0] ?? data.firstDay));
          setTagMissed(wanted);
        }
      })
      .catch((e: Error) => !cancelled && setDays({ state: "error", error: e.message }));
    return () => {
      cancelled = true;
    };
  }, [service, tag]);

  function chooseDay(key: string) {
    if (!service) return;
    setDay(key);
    // Am Handy stehen die Uhrzeiten unter dem Kalender: dorthin scrollen
    requestAnimationFrame(() => slotsRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }));
    setSlot(null);
    setSlots({ state: "loading" });
    fetch(`/api/availability?service=${service.slug}&day=${key}`)
      .then(async (r) => {
        const body = await r.json();
        if (!r.ok) throw new Error(body.error ?? "server_error");
        setSlots({ state: "idle", data: body.slots as Slot[] });
      })
      .catch((e: Error) => setSlots({ state: "error", error: e.message }));
  }

  function chooseService(s: CatalogService) {
    router.push(`/book?service=${s.slug}`, { scroll: false });
  }

  // Schritt 1: Behandlung
  if (!service) {
    return (
      <div ref={topRef} className="scroll-mt-24">
        <StepHeader number={1} title="Wähle deine Behandlung" />
        <div className="mt-8 space-y-12">
          {groups.map((g) => (
            <section key={g.category.id} aria-labelledby={`b-${g.category.slug}`}>
              <h3 id={`b-${g.category.slug}`} className="label text-muted">
                {g.category.name}
              </h3>
              <ul className="mt-3 divide-y divide-line border-y border-line">
                {g.services.map((s) => (
                  <li key={s.id}>
                    <button
                      type="button"
                      onClick={() => chooseService(s)}
                      className="grid w-full grid-cols-[1fr_auto] items-center gap-6 py-5 text-left transition-colors hover:bg-white"
                    >
                      <span>
                        <span className="block text-espresso">{s.name}</span>
                        <span className="mt-1 block text-sm text-muted">{formatDuration(s.duration_minutes)}</span>
                      </span>
                      <span className="whitespace-nowrap text-lg font-light text-espresso">{formatPrice(s.price)}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    );
  }

  const summary = (
    <div className="border border-line bg-white p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-espresso">{service.name}</p>
          <p className="mt-1 text-sm text-muted">
            {formatDuration(service.duration_minutes)}, {formatPrice(service.price)}
          </p>
          {day && slot ? (
            <p className="mt-3 text-espresso">
              {formatDay(day)}, {slot.label} Uhr
            </p>
          ) : null}
        </div>
        <Link href="/book" scroll={false} className="label shrink-0 text-muted underline underline-offset-4 hover:text-espresso">
          Ändern
        </Link>
      </div>
    </div>
  );

  // Schritt 3: Daten
  if (day && slot) {
    return (
      <div ref={topRef} className="scroll-mt-24">
        {summary}
        <StepHeader number={3} title="Deine Daten" />
        <BookingForm
          serviceSlug={service.slug}
          start={slot.start}
          onBack={() => setSlot(null)}
          summary={`${service.name}, ${formatDay(day)}, ${slot.label} Uhr, ${formatPrice(service.price)}`}
          cancelHours={cancelHours}
        />
      </div>
    );
  }

  // Schritt 2: Tag und Uhrzeit
  const available = new Set(days.data?.days ?? []);
  const firstMonth = days.data ? monthKey(days.data.firstDay) : null;
  const lastDay = days.data?.days.at(-1);
  const lastMonth = lastDay ? monthKey(lastDay) : firstMonth;

  return (
    <div ref={topRef} className="scroll-mt-24">
      {summary}
      <StepHeader number={2} title="Wähle Tag und Uhrzeit" />

      {days.state === "loading" ? <p className="mt-8 text-muted">Freie Termine werden geladen …</p> : null}
      {days.state === "error" ? <Unavailable phone={phone} reason={days.error} /> : null}
      {tagMissed ? (
        <p role="status" className="mt-8 border border-line bg-white p-5 text-espresso">
          Schade, am {formatDay(tagMissed)} war jemand schneller. Wähle gerne einen anderen Tag oder bleib auf der Warteliste.
        </p>
      ) : null}
      {days.data && days.data.days.length === 0 ? (
        <p className="mt-8 text-muted">
          In den nächsten Wochen ist für diese Behandlung leider nichts mehr frei. Trag dich gerne auf die Warteliste ein
          oder ruf an: {phone}
        </p>
      ) : null}

      {days.data && month && days.data.days.length > 0 ? (
        <div className="mt-8 grid gap-10 md:grid-cols-[minmax(0,22rem)_1fr]">
          <div>
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setMonth(addMonths(month, -1))}
                disabled={!firstMonth || month <= firstMonth}
                className="flex h-11 w-11 items-center justify-center text-espresso disabled:opacity-25"
                aria-label="Vorheriger Monat"
              >
                <svg width="10" height="18" viewBox="0 0 10 18" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
                  <path d="M9 1L1 9l8 8" />
                </svg>
              </button>
              <p className="text-lg font-light capitalize text-espresso" aria-live="polite">
                {formatMonth(month)}
              </p>
              <button
                type="button"
                onClick={() => setMonth(addMonths(month, 1))}
                disabled={!lastMonth || month >= lastMonth}
                className="flex h-11 w-11 items-center justify-center text-espresso disabled:opacity-25"
                aria-label="Nächster Monat"
              >
                <svg width="10" height="18" viewBox="0 0 10 18" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
                  <path d="M1 1l8 8-8 8" />
                </svg>
              </button>
            </div>
            <table className="mt-3 w-full table-fixed border-collapse text-center">
              <thead>
                <tr>
                  {weekdays.map((w) => (
                    <th key={w} scope="col" className="label pb-2 font-medium text-muted">
                      {w}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {monthGrid(month).map((week, i) => (
                  <tr key={i}>
                    {week.map((key, j) => {
                      if (!key) return <td key={j} />;
                      const free = available.has(key);
                      const selected = key === day;
                      return (
                        <td key={key} className="p-0.5">
                          <button
                            type="button"
                            disabled={!free}
                            onClick={() => chooseDay(key)}
                            aria-pressed={selected}
                            aria-label={`${formatDay(key)}${free ? "" : ", nicht verfügbar"}`}
                            className={`flex aspect-square w-full items-center justify-center text-[0.95rem] transition-colors ${
                              selected
                                ? "bg-espresso text-white"
                                : free
                                  ? "bg-white text-espresso hover:bg-stone"
                                  : "text-muted/40"
                            }`}
                          >
                            {Number(key.slice(8))}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div ref={slotsRef} className="scroll-mt-24">
            {!day ? <p className="text-muted">Wähle einen Tag, dann siehst du die freien Uhrzeiten.</p> : null}
            {day ? <p className="text-lg font-light text-espresso">{formatDay(day)}</p> : null}
            {slots.state === "loading" ? <p className="mt-4 text-muted">Uhrzeiten werden geladen …</p> : null}
            {slots.state === "error" ? <Unavailable phone={phone} reason={slots.error} /> : null}
            {day && slots.data ? (
              slots.data.length > 0 ? (
                <ul className="mt-4 grid grid-cols-3 gap-1.5 sm:grid-cols-4">
                  {slots.data.map((s) => (
                    <li key={s.start}>
                      <button
                        type="button"
                        onClick={() => setSlot(s)}
                        className="flex min-h-12 w-full items-center justify-center border border-line bg-white text-espresso transition-colors hover:border-espresso"
                      >
                        {s.label}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-4 text-muted">An diesem Tag ist leider nichts mehr frei.</p>
              )
            ) : null}
          </div>
        </div>
      ) : null}

      {days.data ? (
        <Waitlist
          key={`${service.slug}-${day ?? ""}`}
          serviceSlug={service.slug}
          defaultDate={day ?? tagMissed ?? days.data.days[0] ?? days.data.firstDay}
          minDate={days.data.firstDay}
          maxDate={days.data.days.at(-1) ?? days.data.firstDay}
        />
      ) : null}
    </div>
  );
}

/**
 * Warteliste: aufklappbar unter dem Kalender. Wird an diesem Tag etwas frei,
 * kommt eine SMS „Hey Beauty, dein Termin ist verfügbar" mit Link direkt zu diesem Tag.
 */
function Waitlist({ serviceSlug, defaultDate, minDate, maxDate }: { serviceSlug: string; defaultDate: string; minDate: string; maxDate: string }) {
  const [state, action, pending] = useActionState<WaitlistFormState, FormData>(joinWaitlist, { ok: false });
  const [renderedAt] = useState(() => Date.now());
  const e = state.fieldErrors ?? {};

  if (state.ok) {
    return (
      <div role="status" className="mt-14 border border-line bg-white p-6">
        <p className="text-lg font-light text-espresso">Du stehst auf der Warteliste.</p>
        <p className="mt-2 text-muted">
          Wird an deinem Wunschtag etwas frei, bekommst du sofort eine SMS mit Link. Wer zuerst bucht, bekommt den Termin.
        </p>
      </div>
    );
  }

  return (
    <details className="group mt-14 border-t border-line pt-6" open={Boolean(state.message || state.fieldErrors)}>
      <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-4 text-espresso">
        <span>
          <span className="block text-lg font-light">Deine Wunschzeit ist nicht dabei?</span>
          <span className="mt-1 block text-sm text-muted">Trag dich auf die Warteliste ein. Sagt jemand ab, bekommst du eine SMS.</span>
        </span>
        <span aria-hidden="true" className="text-2xl font-light text-taupe transition-transform group-open:rotate-45">+</span>
      </summary>
      <form action={action} className="mt-6 space-y-6" noValidate>
        <input type="hidden" name="service" value={serviceSlug} />
        <input type="hidden" name="renderedAt" value={renderedAt} />
        <div aria-hidden="true" className="absolute -left-[9999px]">
          <label>
            Website
            <input type="text" name="website" tabIndex={-1} autoComplete="off" />
          </label>
        </div>
        {state.message ? (
          <p role="alert" className="border border-espresso bg-white p-4 text-espresso">{state.message}</p>
        ) : null}
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <label htmlFor="w-date" className="label text-muted">Wunschtag</label>
            <input id="w-date" type="date" name="date" required defaultValue={defaultDate} min={minDate} max={maxDate} className={fieldClass} />
            {e.date ? <p className="mt-2 text-sm text-espresso">{e.date}</p> : null}
          </div>
          <div>
            <label htmlFor="w-window" className="label text-muted">Zeitfenster</label>
            <select id="w-window" name="window" defaultValue="ganztags" className={fieldClass}>
              {waitlistWindows.map((w) => (
                <option key={w.value} value={w.value}>{w.label}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="grid gap-6 sm:grid-cols-2">
          <Field label="Vorname" name="firstName" idPrefix="w" autoComplete="given-name" error={e.firstName} />
          <Field label="Nachname" name="lastName" idPrefix="w" autoComplete="family-name" error={e.lastName} />
        </div>
        <div className="grid gap-6 sm:grid-cols-2">
          <Field label="Handynummer" name="phone" idPrefix="w" type="tel" autoComplete="tel" error={e.phone} hint="Hierhin kommt die SMS." />
          <Field label="E-Mail (freiwillig)" name="email" idPrefix="w" type="email" autoComplete="email" error={e.email} required={false} />
        </div>
        <label className="flex items-start gap-3 text-[0.95rem] text-muted">
          <input type="checkbox" name="consent" className="mt-1 h-5 w-5 shrink-0 accent-espresso" />
          <span>
            Ich möchte per SMS (und E-Mail, falls angegeben) benachrichtigt werden, wenn an meinem Wunschtag etwas frei wird.
            Mehr im <Link href="/datenschutz" target="_blank" className="underline underline-offset-4">Datenschutzhinweis</Link>.
          </span>
        </label>
        {e.consent ? <p className="text-sm text-espresso">{e.consent}</p> : null}
        <button
          type="submit"
          disabled={pending}
          className="label inline-flex min-h-12 items-center justify-center border border-espresso px-8 text-espresso transition-colors hover:bg-espresso hover:text-white disabled:opacity-60"
        >
          {pending ? "Wird eingetragen …" : "Auf die Warteliste"}
        </button>
      </form>
    </details>
  );
}

function StepHeader({ number, title }: { number: number; title: string }) {
  return (
    <h2 className="mt-10 flex items-baseline gap-4 text-2xl font-light text-espresso md:text-3xl">
      <span className="text-base font-normal text-taupe">{number}/3</span>
      {title}
    </h2>
  );
}

function Unavailable({ phone, reason }: { phone: string; reason?: string }) {
  const text =
    reason === "not_configured"
      ? "Die Online-Buchung wird gerade eingerichtet."
      : "Die freien Termine konnten gerade nicht geladen werden.";
  return (
    <p role="alert" className="mt-6 border border-line bg-white p-5 text-muted">
      {text} Ruf gerne direkt im Studio an: {phone}
    </p>
  );
}

const fieldClass =
  "mt-2 block min-h-12 w-full border border-line bg-white px-4 text-espresso outline-none transition-colors focus:border-espresso";

const months = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];

function BookingForm({
  serviceSlug,
  start,
  onBack,
  summary,
  cancelHours,
}: {
  serviceSlug: string;
  start: string;
  onBack: () => void;
  summary: string;
  cancelHours: number;
}) {
  const [state, action, pending] = useActionState<BookingFormState, FormData>(createBooking, { ok: false });
  const [renderedAt] = useState(() => Date.now());
  const errorRef = useRef<HTMLParagraphElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const e = state.fieldErrors ?? {};
  const v = state.values ?? {};

  useEffect(() => {
    // Antwort vom Server: Fenster schließen, außer es fehlt nur das Häkchen
    const onlyTerms = state.fieldErrors && Object.keys(state.fieldErrors).every((k) => k === "terms");
    if (!onlyTerms) dialogRef.current?.close();
    if (state.message) errorRef.current?.focus();
  }, [state]);

  function openConfirm() {
    // Pflichtfelder zuerst im Browser prüfen, dann das Bestätigungs-Fenster öffnen
    if (formRef.current && !formRef.current.reportValidity()) return;
    dialogRef.current?.showModal();
  }

  return (
    <form ref={formRef} action={action} className="mt-8 space-y-6" noValidate>
      <input type="hidden" name="service" value={serviceSlug} />
      <input type="hidden" name="start" value={start} />
      <input type="hidden" name="renderedAt" value={renderedAt} />
      {/* Spam-Falle: für Menschen unsichtbar */}
      <div aria-hidden="true" className="absolute -left-[9999px]">
        <label>
          Website
          <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      {state.message ? (
        <p ref={errorRef} tabIndex={-1} role="alert" className="border border-espresso bg-white p-4 text-espresso">
          {state.message}
        </p>
      ) : null}

      <div className="grid gap-6 sm:grid-cols-2">
        <Field label="Vorname" name="firstName" autoComplete="given-name" error={e.firstName} defaultValue={v.firstName} />
        <Field label="Nachname" name="lastName" autoComplete="family-name" error={e.lastName} defaultValue={v.lastName} />
      </div>
      <Field label="E-Mail" name="email" type="email" autoComplete="email" error={e.email} defaultValue={v.email} />
      <Field label="Telefon" name="phone" type="tel" autoComplete="tel" error={e.phone} defaultValue={v.phone} hint="Für Rückfragen zu deinem Termin." />

      <div>
        <label htmlFor="notes" className="label text-muted">
          Anmerkung (freiwillig)
        </label>
        <textarea id="notes" name="notes" rows={3} maxLength={500} defaultValue={v.notes} className={`${fieldClass} py-3`} />
        <p className="mt-2 text-sm text-muted">Bitte keine Gesundheitsangaben. Die bespricht Filo persönlich mit dir vor Ort.</p>
        {e.notes ? <p className="mt-2 text-sm text-espresso">{e.notes}</p> : null}
      </div>

      <div className="space-y-4 border-t border-line pt-6">
        <fieldset>
          <legend className="label text-muted">Geburtstag (freiwillig)</legend>
          <div className="mt-2 flex gap-2">
            <select name="birthdayDay" defaultValue={v.birthdayDay ?? ""} aria-label="Tag" className={`${fieldClass} mt-0 w-24`}>
              <option value="">Tag</option>
              {Array.from({ length: 31 }, (_, i) => <option key={i + 1} value={i + 1}>{i + 1}.</option>)}
            </select>
            <select name="birthdayMonth" defaultValue={v.birthdayMonth ?? ""} aria-label="Monat" className={`${fieldClass} mt-0 flex-1`}>
              <option value="">Monat</option>
              {months.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
            </select>
          </div>
          <p className="mt-2 text-sm text-muted">Für eine kleine Überraschung an deinem Geburtstag. Das Jahr brauchen wir nicht.</p>
        </fieldset>
        <label className="flex items-start gap-3 text-[0.95rem] text-muted">
          <input type="checkbox" name="marketing" className="mt-1 h-5 w-5 shrink-0 accent-espresso" />
          <span>Ich möchte Neuigkeiten, Angebote und Geburtstagsgrüße per E-Mail oder SMS erhalten (jederzeit abbestellbar).</span>
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-4 pt-2">
        <button
          type="button"
          onClick={openConfirm}
          className="label inline-flex min-h-12 items-center justify-center bg-espresso px-8 text-white transition-colors hover:bg-taupe"
        >
          Weiter zur Bestätigung
        </button>
        <button type="button" onClick={onBack} className="label min-h-12 text-muted underline underline-offset-4 hover:text-espresso">
          Andere Uhrzeit
        </button>
      </div>
      <p className="text-sm text-muted">Bezahlt wird vor Ort im Studio.</p>

      {/* Bestätigungs-Fenster: Zusammenfassung und Buchungsbedingungen, erst dann verbindlich buchen */}
      <dialog
        ref={dialogRef}
        aria-labelledby="confirm-title"
        className="m-auto w-[calc(100%-2rem)] max-w-lg bg-white p-0 text-espresso backdrop:bg-espresso/60"
      >
        <div className="max-h-[85dvh] overflow-y-auto p-6 md:p-8">
          <h2 id="confirm-title" className="text-2xl font-light">Termin bestätigen</h2>
          <p className="mt-4 border-y border-line py-4 leading-relaxed">{summary}</p>
          <h3 className="label mt-6 text-muted">Buchungsbedingungen</h3>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-[0.95rem] leading-relaxed text-muted">
            <li>Kostenlos absagen kannst du bis {cancelHours} Stunden vor dem Termin über den Link in deiner Bestätigung.</li>
            <li>Danach oder bei Nichterscheinen ruf bitte im Studio an, damit Filo die Zeit vergeben kann.</li>
            <li>Bei Verspätung kann sich die Behandlungszeit verkürzen.</li>
            <li>Bezahlt wird vor Ort im Studio.</li>
          </ul>
          <label className="mt-6 flex items-start gap-3 text-[0.95rem]">
            <input type="checkbox" name="terms" className="mt-1 h-5 w-5 shrink-0 accent-espresso" />
            <span>
              Ich akzeptiere die Buchungsbedingungen und habe die{" "}
              <Link href="/stornierung" target="_blank" className="underline underline-offset-4">Stornierungsbedingungen</Link> und den{" "}
              <Link href="/datenschutz" target="_blank" className="underline underline-offset-4">Datenschutzhinweis</Link> gelesen.
            </span>
          </label>
          {e.terms ? <p className="mt-2 text-sm">{e.terms}</p> : null}
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <button
              type="submit"
              disabled={pending}
              className="label inline-flex min-h-12 items-center justify-center bg-espresso px-8 text-white transition-colors hover:bg-taupe disabled:opacity-60"
            >
              {pending ? "Wird gebucht …" : "Verbindlich buchen"}
            </button>
            <button type="button" onClick={() => dialogRef.current?.close()} className="label min-h-12 text-muted underline underline-offset-4 hover:text-espresso">
              Zurück
            </button>
          </div>
        </div>
      </dialog>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  autoComplete,
  error,
  defaultValue,
  hint,
  idPrefix = "f",
  required = true,
}: {
  label: string;
  name: string;
  type?: string;
  autoComplete?: string;
  error?: string;
  defaultValue?: string;
  hint?: string;
  idPrefix?: string;
  required?: boolean;
}) {
  const id = `${idPrefix}-${name}`;
  return (
    <div>
      <label htmlFor={id} className="label text-muted">
        {label}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        autoComplete={autoComplete}
        defaultValue={defaultValue}
        required={required}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`${fieldClass} ${error ? "border-espresso" : ""}`}
      />
      {hint && !error ? <p className="mt-2 text-sm text-muted">{hint}</p> : null}
      {error ? (
        <p id={`${id}-error`} className="mt-2 text-sm text-espresso">
          {error}
        </p>
      ) : null}
    </div>
  );
}
