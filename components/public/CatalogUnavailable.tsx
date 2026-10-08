import { brand } from "@/lib/brand.config";

/** Wird gezeigt, wenn die Behandlungen gerade nicht geladen werden konnten. */
export function CatalogUnavailable() {
  return (
    <div className="rounded-3xl border border-line bg-sand/40 p-8 text-cocoa">
      <p className="font-serif text-2xl text-ink">Die Behandlungen laden gerade nicht.</p>
      <p className="mt-3 leading-relaxed">
        Bitte lade die Seite in ein paar Minuten neu. Du erreichst uns auch direkt unter{" "}
        <a href={`tel:${brand.contact.phone.replace(/\s/g, "")}`} className="underline underline-offset-4">
          {brand.contact.phone}
        </a>
        .
      </p>
    </div>
  );
}
