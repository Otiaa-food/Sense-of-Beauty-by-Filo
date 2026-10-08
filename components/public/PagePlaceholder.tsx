import Link from "next/link";

/** Platzhalter für Seiten, die in späteren Phasen mit echtem Inhalt gefüllt werden. */
export function PagePlaceholder({
  title,
  intro,
  phase,
}: {
  title: string;
  intro: string;
  phase: string;
}) {
  return (
    <section className="mx-auto w-full max-w-3xl px-5 py-20 md:py-28">
      <p className="text-xs uppercase tracking-[0.3em] text-cocoa">{phase}</p>
      <h1 className="mt-4 font-serif text-4xl text-ink md:text-5xl">{title}</h1>
      <p className="mt-6 max-w-xl leading-relaxed text-cocoa">{intro}</p>
      <Link
        href="/"
        className="mt-10 inline-block text-sm tracking-wide text-cocoa underline underline-offset-4 hover:text-ink"
      >
        Zur Startseite
      </Link>
    </section>
  );
}
