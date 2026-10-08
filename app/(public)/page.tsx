import Link from "next/link";
import { brand } from "@/lib/brand.config";

/** Startseite. Der echte Aufbau mit Fotos und Story folgt in Phase 3. */
export default function HomePage() {
  return (
    <section className="mx-auto flex min-h-[70dvh] w-full max-w-6xl flex-col justify-center px-5 py-20">
      <p className="text-xs uppercase tracking-[0.35em] text-cocoa">
        {brand.address.city}
      </p>
      <h1 className="mt-5 max-w-2xl font-serif text-5xl leading-[1.05] text-ink md:text-7xl">
        {brand.fullName}
      </h1>
      <p className="mt-6 max-w-md text-lg leading-relaxed text-cocoa">
        {brand.tagline}
      </p>
      <div className="mt-10 flex flex-wrap gap-4">
        <Link
          href="/book"
          className="rounded-full bg-cocoa px-7 py-3 text-sm tracking-wide text-cream transition-colors hover:bg-ink"
        >
          Termin buchen
        </Link>
        <Link
          href="/treatments"
          className="rounded-full border border-cocoa px-7 py-3 text-sm tracking-wide text-cocoa transition-colors hover:bg-sand/60"
        >
          Behandlungen entdecken
        </Link>
      </div>
    </section>
  );
}
