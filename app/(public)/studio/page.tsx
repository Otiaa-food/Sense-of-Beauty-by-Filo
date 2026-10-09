import type { Metadata } from "next";
import { PageIntro } from "@/components/public/PageIntro";
import { PhotoFill } from "@/components/public/PhotoFill";
import { SocialGrid } from "@/components/public/SocialGrid";
import { brand } from "@/lib/brand.config";
import { studioGallery } from "@/lib/media";

export const metadata: Metadata = {
  title: "Das Studio",
  description: `So sieht es bei ${brand.fullName} in ${brand.address.city} aus.`,
  alternates: { canonical: "/studio" },
};

// Mosaik wie in Lumos Studiogalerie: ein großes Feld, daneben kleinere (weitere Fotos laufen einfach weiter).
const spans = ["col-span-2 row-span-2", "md:row-span-2", ""];

export default function StudioPage() {
  return (
    <>
      <section className="mx-auto w-full max-w-7xl px-5 pb-12 pt-16 md:px-8 md:pt-24">
        <PageIntro title="Das Studio">
          <p>
            Dich erwartet ein ruhiger Ort im 2. Obergeschoss in der {brand.address.street} in {brand.address.city}.
            Hier hast du Zeit für dich und deine Haut, von der Hautanalyse bis zur Pflegeempfehlung für zu Hause.
          </p>
        </PageIntro>
      </section>

      <ul className="mx-auto grid max-w-7xl auto-rows-[14rem] grid-cols-2 gap-1.5 px-1.5 md:auto-rows-[18rem] md:grid-cols-3">
        {studioGallery.map((p, i) => (
          <li key={p.src} className={`relative ${spans[i] ?? ""}`}>
            <PhotoFill photo={p} sizes="(min-width: 768px) 50vw, 100vw" priority={i === 0} />
          </li>
        ))}
      </ul>

      <SocialGrid />
    </>
  );
}
