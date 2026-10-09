import type { Metadata } from "next";
import { PageIntro } from "@/components/public/PageIntro";
import { PhotoFill } from "@/components/public/PhotoFill";
import { SocialGrid } from "@/components/public/SocialGrid";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { brand } from "@/lib/brand.config";
import { photos } from "@/lib/media";

export const metadata: Metadata = {
  title: "Über Filo",
  description: "Lerne Filo kennen, deine Kosmetikerin für Korean Skincare in Pforzheim.",
  alternates: { canonical: "/about" },
};

// ENTWURF: Texte bitte von Filo prüfen und mit ihren eigenen Worten ergänzen (Werdegang, Philosophie).
// Es werden keine Angaben erfunden. Die Schulung stammt aus Filos Instagram-Beitrag (Februar 2026).
export default function AboutPage() {
  return (
    <>
      <section className="mx-auto w-full max-w-3xl px-5 pb-12 pt-16 md:pt-24">
        <PageIntro title="Hey, ich bin Filo.">
          <p>
            Ich bin Kosmetikerin und Inhaberin von {brand.fullName} in {brand.address.city}. Mein Schwerpunkt ist
            Korean Skincare: Wirkstoffkosmetik nach koreanischem Vorbild, persönlich auf deine Haut abgestimmt.
          </p>
        </PageIntro>
      </section>

      <div className="mx-auto max-w-3xl px-1.5 sm:px-5">
        <div className="relative aspect-[4/5]">
          <PhotoFill photo={photos.filoNeon} sizes="(min-width: 768px) 768px, 100vw" priority />
        </div>
      </div>

      <section className="mx-auto max-w-3xl px-5 py-14 md:py-20">
        <h2 className="text-3xl font-light text-espresso md:text-4xl">Mein Werdegang</h2>
        <div className="mt-6 space-y-4 text-[1rem] leading-[1.85] text-muted">
          <p>
            Koreanische Hautpflege begleitet mich schon lange. Um meine Behandlungen stetig weiterzuentwickeln,
            bilde ich mich regelmäßig fort.
          </p>
          <p>
            Im Februar 2026 habe ich in Frankfurt eine Schulung zum K-Beauty Facial mit den Produkten von OD Graphy
            abgeschlossen.
          </p>
        </div>
      </section>

      <div className="mx-auto grid max-w-3xl grid-cols-2 gap-1.5 px-1.5 sm:px-5">
        <div className="relative aspect-[4/5]">
          <PhotoFill photo={photos.schulungZertifikat} sizes="(min-width: 768px) 384px, 50vw" />
        </div>
        <div className="relative aspect-[4/5]">
          <PhotoFill photo={photos.schulungTrainerin} sizes="(min-width: 768px) 384px, 50vw" />
        </div>
      </div>

      <section className="mx-auto max-w-3xl px-5 py-14 md:py-20">
        <h2 className="text-3xl font-light text-espresso md:text-4xl">Meine Philosophie</h2>
        <div className="mt-6 space-y-4 text-[1rem] leading-[1.85] text-muted">
          <p>
            Jede Haut ist anders. Deshalb gibt es bei mir keine Behandlung von der Stange: Ich schaue mir deine Haut
            an, erkläre dir, was ich tue, und empfehle dir nur, was du wirklich brauchst.
          </p>
          <p>Mein Ziel ist, dass du dich in deiner Haut wohlfühlst und weißt, wie du sie zu Hause pflegst.</p>
        </div>
        <div className="mt-10 flex flex-wrap gap-3">
          <ButtonLink href="/book">Termin buchen</ButtonLink>
          <ButtonLink href="/reviews" variant="outline">
            Stimmen lesen
          </ButtonLink>
        </div>
      </section>

      <SocialGrid />
    </>
  );
}
