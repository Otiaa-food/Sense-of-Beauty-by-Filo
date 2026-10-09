import Image from "next/image";
import { brand } from "@/lib/brand.config";
import { socialGrid } from "@/lib/media";

/** Instagram-Bereich mit fest ausgewählten Fotos (kein Live-Feed, keine Cookies). */
export function SocialGrid() {
  return (
    <section className="py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-5 text-center md:px-8">
        <a
          href={brand.contact.instagram}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex flex-col items-center gap-4 text-espresso hover:text-taupe"
        >
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
            <rect x="3" y="3" width="18" height="18" rx="5" />
            <circle cx="12" cy="12" r="4" />
            <circle cx="17.5" cy="6.5" r="0.8" fill="currentColor" />
          </svg>
          <span className="text-2xl font-light md:text-3xl">{brand.contact.instagramHandle}</span>
        </a>
        <p className="mt-3 text-muted">Folge Filo für Neuigkeiten, Aktionen und mehr.</p>
      </div>

      <ul className="mt-12 grid grid-cols-3 gap-1.5 px-1.5 md:grid-cols-7">
        {socialGrid.map((p, i) => (
          <li key={`${p.src}-${i}`} className={`relative aspect-[4/5] overflow-hidden bg-stone ${i >= 6 ? "hidden md:block" : ""}`}>
            <Image src={p.src} alt={p.alt} fill sizes="(min-width: 768px) 12.5vw, 25vw" className="object-cover" style={{ objectPosition: p.focus }} />
          </li>
        ))}
      </ul>
    </section>
  );
}
