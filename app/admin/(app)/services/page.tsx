import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminTitle, btnSolid, Flash, inputClass, Loading } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin/auth";
import { saveService } from "../actions";

export const metadata: Metadata = { title: "Behandlungen" };

type Props = { searchParams: Promise<{ meldung?: string }> };

export default function ServicesPage(props: Props) {
  return (
    <>
      <AdminTitle>Behandlungen</AdminTitle>
      <Suspense fallback={<Loading />}>
        <List {...props} />
      </Suspense>
    </>
  );
}

type Service = {
  id: string;
  name: string;
  price: number;
  duration_minutes: number;
  buffer_minutes: number;
  online_booking_enabled: boolean;
  addon_only: boolean;
  active: boolean;
  service_categories: { name: string; sort_order: number } | null;
};

async function List({ searchParams }: Props) {
  const { supabase } = await requireAdmin();
  const { meldung } = await searchParams;
  const { data } = await supabase
    .from("services")
    .select("id, name, price, duration_minutes, buffer_minutes, online_booking_enabled, addon_only, active, sort_order, service_categories(name, sort_order)")
    .order("sort_order");
  const services = (data ?? []) as unknown as Service[];
  const categories = [...new Set(services.map((s) => s.service_categories?.name ?? "Weitere"))];

  return (
    <>
      <Flash code={meldung} />
      <p className="mb-8 max-w-2xl text-muted">
        Änderungen an Preis, Dauer und Pause erscheinen sofort auf der Website und gelten für neue Buchungen. Bestehende
        Termine behalten ihren Preis und ihre Dauer.
      </p>
      <div className="space-y-10">
        {categories.map((cat) => (
          <section key={cat}>
            <h2 className="label text-muted">{cat}</h2>
            <ul className="mt-2 divide-y divide-line border-y border-line bg-white">
              {services
                .filter((s) => (s.service_categories?.name ?? "Weitere") === cat)
                .map((s) => (
                  <li key={s.id} id={`s-${s.id}`} className="scroll-mt-24 px-4 py-4">
                    <form action={saveService}>
                      <input type="hidden" name="id" value={s.id} />
                      <p className={`text-espresso ${s.active ? "" : "opacity-50"}`}>{s.name}</p>
                      <div className="mt-3 flex flex-wrap items-end gap-3">
                        <label className="block w-24"><span className="label !text-[0.6rem] text-muted">Preis €</span><input name="price" inputMode="decimal" defaultValue={Number(s.price)} className={inputClass} /></label>
                        <label className="block w-24"><span className="label !text-[0.6rem] text-muted">Dauer Min.</span><input name="duration_minutes" type="number" min={5} step={5} defaultValue={s.duration_minutes} className={inputClass} /></label>
                        <label className="block w-24"><span className="label !text-[0.6rem] text-muted">Pause Min.</span><input name="buffer_minutes" type="number" min={0} step={5} defaultValue={s.buffer_minutes} className={inputClass} /></label>
                        <label className="flex min-h-11 items-center gap-2 text-sm text-muted">
                          <input type="checkbox" name="online_booking_enabled" defaultChecked={s.online_booking_enabled} disabled={s.addon_only} className="h-5 w-5 accent-espresso" />
                          Online buchbar
                        </label>
                        <label className="flex min-h-11 items-center gap-2 text-sm text-muted">
                          <input type="checkbox" name="active" defaultChecked={s.active} className="h-5 w-5 accent-espresso" />
                          Auf der Website
                        </label>
                        <button type="submit" className={btnSolid}>Speichern</button>
                      </div>
                      {s.addon_only ? <p className="mt-2 text-xs text-muted">Zusatzleistung: nur zusammen mit einem Facial, nicht einzeln online buchbar.</p> : null}
                    </form>
                  </li>
                ))}
            </ul>
          </section>
        ))}
      </div>
    </>
  );
}
