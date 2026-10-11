import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminTitle, btnOutline, btnSolid, Flash, inputClass, Loading } from "@/components/admin/ui";
import { Stars } from "@/components/public/Reviews";
import { requireAdmin } from "@/lib/admin/auth";
import { fmtDate } from "@/lib/admin/format";
import { parseSummary, sourceLabel, type ReviewSource } from "@/lib/reviews";
import { addReview, deleteReview, saveReviewSummary, setReviewVisible } from "../actions";

export const metadata: Metadata = { title: "Bewertungen" };

type Props = { searchParams: Promise<{ meldung?: string }> };

export default function ReviewsAdminPage(props: Props) {
  return (
    <>
      <AdminTitle>Bewertungen</AdminTitle>
      <Suspense fallback={<Loading />}>
        <Content {...props} />
      </Suspense>
    </>
  );
}

type Row = {
  id: string;
  author_name: string;
  rating: number;
  text: string | null;
  source: ReviewSource;
  review_date: string | null;
  visible: boolean;
  consent_confirmed_at: string | null;
};

async function Content({ searchParams }: Props) {
  const { supabase } = await requireAdmin();
  const { meldung } = await searchParams;
  const [{ data: rows }, { data: s }] = await Promise.all([
    supabase
      .from("reviews")
      .select("id, author_name, rating, text, source, review_date, visible, consent_confirmed_at")
      .order("created_at", { ascending: false }),
    supabase.from("settings").select("value").eq("key", "review_summary").maybeSingle(),
  ]);
  const summary = parseSummary(s?.value);
  const list = (rows ?? []) as Row[];

  return (
    <div className="max-w-3xl">
      <Flash code={meldung} />

      <section>
        <h2 className="text-2xl font-light text-espresso">Übersicht auf der Website</h2>
        <p className="mt-2 text-muted">
          Sterneschnitt und Anzahl von Google und Planity. Bitte gelegentlich aktualisieren, die Zahlen müssen stimmen. Leer lassen = wird nicht angezeigt.
        </p>
        <form action={saveReviewSummary} className="mt-5 space-y-5 border border-line bg-white p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <fieldset className="space-y-3">
              <legend className="label text-espresso">Google</legend>
              <label className="block"><span className="label !text-[0.6rem] text-muted">Schnitt (z. B. 4,9)</span><input name="google_rating" inputMode="decimal" defaultValue={summary.google.rating?.toString().replace(".", ",") ?? ""} className={inputClass} /></label>
              <label className="block"><span className="label !text-[0.6rem] text-muted">Anzahl</span><input name="google_count" type="number" min={0} defaultValue={summary.google.count ?? ""} className={inputClass} /></label>
            </fieldset>
            <fieldset className="space-y-3">
              <legend className="label text-espresso">Planity</legend>
              <label className="block"><span className="label !text-[0.6rem] text-muted">Schnitt</span><input name="planity_rating" inputMode="decimal" defaultValue={summary.planity.rating?.toString().replace(".", ",") ?? ""} className={inputClass} /></label>
              <label className="block"><span className="label !text-[0.6rem] text-muted">Anzahl</span><input name="planity_count" type="number" min={0} defaultValue={summary.planity.count ?? ""} className={inputClass} /></label>
            </fieldset>
          </div>
          <label className="block"><span className="label !text-[0.6rem] text-muted">Link zu deinem Planity-Profil</span><input name="planity_url" type="url" placeholder="https://www.planity.com/…" defaultValue={summary.planity.url ?? ""} className={inputClass} /></label>
          <button type="submit" className={btnSolid}>Übersicht speichern</button>
        </form>
      </section>

      <section className="mt-14">
        <h2 className="text-2xl font-light text-espresso">Kundenstimmen</h2>
        <p className="mt-2 text-muted">
          Zitate erscheinen nur mit Einwilligung der Kundin, egal ob von Google, Planity oder persönlich. Am besten kurz per Nachricht fragen und
          nur Vorname und Anfangsbuchstabe verwenden (z. B. „Maria K.“).
        </p>

        <ul className="mt-6 divide-y divide-line border-y border-line bg-white">
          {list.length === 0 ? <li className="px-4 py-4 text-muted">Noch keine Stimmen eingetragen.</li> : null}
          {list.map((r) => (
            <li key={r.id} className="px-4 py-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-espresso">{r.author_name}</span>
                <span className="flex items-center gap-2 text-xs text-muted">
                  <Stars value={r.rating} /> {sourceLabel[r.source]}
                  {r.review_date ? `, ${fmtDate(r.review_date, { month: "short", year: "numeric" })}` : ""}
                </span>
              </div>
              {r.text ? <p className="mt-2 text-sm leading-relaxed text-muted">„{r.text}“</p> : null}
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <span className={`label !text-[0.6rem] ${r.visible ? "text-espresso" : "text-muted"}`}>
                  {r.visible ? "Auf der Website" : "Nicht sichtbar"}
                </span>
                <form action={setReviewVisible} className="flex flex-wrap items-center gap-3">
                  <input type="hidden" name="id" value={r.id} />
                  <input type="hidden" name="visible" value={r.visible ? "false" : "true"} />
                  {!r.visible && !r.consent_confirmed_at ? (
                    <label className="flex items-center gap-2 text-xs text-muted">
                      <input type="checkbox" name="consent" required className="h-4 w-4 accent-espresso" /> Kundin hat zugestimmt
                    </label>
                  ) : null}
                  <button type="submit" className="text-sm text-espresso underline underline-offset-4">{r.visible ? "Ausblenden" : "Freigeben"}</button>
                </form>
                <form action={deleteReview}>
                  <input type="hidden" name="id" value={r.id} />
                  <button type="submit" className="text-sm text-muted underline underline-offset-4 hover:text-espresso">Löschen</button>
                </form>
              </div>
            </li>
          ))}
        </ul>

        <form action={addReview} className="mt-6 space-y-4 border border-line bg-white p-5">
          <p className="label text-espresso">Neue Stimme</p>
          <div className="grid gap-4 sm:grid-cols-3">
            <label className="block sm:col-span-2"><span className="label !text-[0.6rem] text-muted">Name (z. B. Maria K.)</span><input name="author_name" required maxLength={80} className={inputClass} /></label>
            <label className="block"><span className="label !text-[0.6rem] text-muted">Sterne</span>
              <select name="rating" defaultValue="5" className={inputClass}>{[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n}</option>)}</select>
            </label>
            <label className="block"><span className="label !text-[0.6rem] text-muted">Quelle</span>
              <select name="source" defaultValue="google" className={inputClass}><option value="google">Google</option><option value="planity">Planity</option><option value="manual">Persönlich</option></select>
            </label>
            <label className="block"><span className="label !text-[0.6rem] text-muted">Datum</span><input name="review_date" type="date" className={inputClass} /></label>
          </div>
          <label className="block"><span className="label !text-[0.6rem] text-muted">Text (genau wie geschrieben)</span><textarea name="text" rows={4} maxLength={1200} className={`${inputClass} py-2`} /></label>
          <label className="flex items-center gap-2 text-sm text-muted"><input type="checkbox" name="consent" className="h-5 w-5 accent-espresso" /> Die Kundin hat zugestimmt, dass ihre Bewertung auf der Website steht</label>
          <label className="flex items-center gap-2 text-sm text-muted"><input type="checkbox" name="visible" className="h-5 w-5 accent-espresso" /> Sofort auf der Website zeigen (nur mit Zustimmung)</label>
          <button type="submit" className={btnOutline}>Stimme speichern</button>
        </form>
      </section>
    </div>
  );
}
