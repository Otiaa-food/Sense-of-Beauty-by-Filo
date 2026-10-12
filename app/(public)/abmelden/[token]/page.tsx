import type { Metadata } from "next";
import { Suspense } from "react";
import { PageIntro } from "@/components/public/PageIntro";
import { unsubscribe } from "./actions";

export const metadata: Metadata = { title: "Nachrichten abbestellen", robots: { index: false, follow: false } };

type Props = { params: Promise<{ token: string }>; searchParams: Promise<{ erledigt?: string }> };

export default function UnsubscribePage(props: Props) {
  return (
    <section className="mx-auto w-full max-w-2xl px-5 py-16 md:py-24">
      <Suspense fallback={null}>
        <Content {...props} />
      </Suspense>
    </section>
  );
}

async function Content({ params, searchParams }: Props) {
  const { token } = await params;
  const { erledigt } = await searchParams;
  if (erledigt) {
    return (
      <PageIntro title="Abbestellt">
        <p>Du bekommst keine Angebote, Geburtstagsgrüße und Erinnerungen an neue Behandlungen mehr. Nachrichten zu gebuchten Terminen erhältst du weiterhin.</p>
      </PageIntro>
    );
  }
  return (
    <>
      <PageIntro title="Nachrichten abbestellen">
        <p>Möchtest du keine Angebote, Geburtstagsgrüße und Erinnerungen an neue Behandlungen mehr bekommen, weder per E-Mail noch per SMS?</p>
      </PageIntro>
      {/* Bewusst mit Knopf: Mailprogramme öffnen Links manchmal automatisch */}
      <form action={unsubscribe} className="mt-8">
        <input type="hidden" name="token" value={token} />
        <button type="submit" className="label inline-flex min-h-12 items-center bg-espresso px-7 text-white hover:bg-taupe">Ja, abbestellen</button>
      </form>
    </>
  );
}
