import Link from "next/link";
import { PageIntro } from "@/components/public/PageIntro";

/** Platzhalter für Seiten, die in späteren Phasen mit echtem Inhalt gefüllt werden. */
export function PagePlaceholder({ title, intro, phase }: { title: string; intro: string; phase: string }) {
  return (
    <section className="mx-auto w-full max-w-7xl px-5 py-16 md:px-8 md:py-24">
      <p className="label text-muted">{phase}</p>
      <div className="mt-4">
        <PageIntro title={title}>
          <p>{intro}</p>
        </PageIntro>
      </div>
      <Link href="/" className="label mt-10 inline-block text-espresso underline underline-offset-4">
        Zur Startseite
      </Link>
    </section>
  );
}
