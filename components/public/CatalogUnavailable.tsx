import { brand } from "@/lib/brand.config";

/** Wird gezeigt, wenn die Behandlungen gerade nicht geladen werden konnten. */
export function CatalogUnavailable() {
  return (
    <div className="border border-line bg-white p-8 text-muted">
      <p className="text-xl font-light text-espresso">Die Behandlungen laden gerade nicht.</p>
      <p className="mt-3 leading-relaxed">
        Bitte lade die Seite in ein paar Minuten neu. Du erreichst uns auch direkt unter{" "}
        <a href={`tel:${brand.contact.phone.replace(/\s/g, "")}`} className="text-espresso underline underline-offset-4">
          {brand.contact.phone}
        </a>
        .
      </p>
    </div>
  );
}
