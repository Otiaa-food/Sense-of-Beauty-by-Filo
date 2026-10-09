import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AdminTitle, btnOutline, inputClass, Loading } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin/auth";

export const metadata: Metadata = { title: "Kundinnen" };

type Props = { searchParams: Promise<{ q?: string }> };

export default function CustomersPage(props: Props) {
  return (
    <>
      <AdminTitle>Kundinnen</AdminTitle>
      <Suspense fallback={<Loading />}>
        <List {...props} />
      </Suspense>
    </>
  );
}

async function List({ searchParams }: Props) {
  const { supabase } = await requireAdmin();
  const { q = "" } = await searchParams;
  const term = q.trim().replace(/[%,()]/g, " ").slice(0, 60);
  let query = supabase
    .from("customers")
    .select("id, first_name, last_name, email, phone")
    .is("anonymized_at", null)
    .order("last_name")
    .limit(100);
  if (term) {
    query = query.or(`first_name.ilike.%${term}%,last_name.ilike.%${term}%,email.ilike.%${term}%,phone.ilike.%${term}%`);
  }
  const { data } = await query;

  return (
    <>
      <form className="mb-6 flex max-w-xl gap-2" role="search">
        <input name="q" defaultValue={q} placeholder="Name, E-Mail oder Telefon" aria-label="Kundin suchen" className={`${inputClass} mt-0`} />
        <button type="submit" className={btnOutline}>Suchen</button>
      </form>
      {(data ?? []).length === 0 ? <p className="text-muted">Keine Kundinnen gefunden.</p> : null}
      <ul className="divide-y divide-line border-y border-line bg-white">
        {(data ?? []).map((c) => (
          <li key={c.id}>
            <Link href={`/admin/customers/${c.id}`} className="block px-4 py-3 hover:bg-paper">
              <span className="block text-espresso">{c.last_name}, {c.first_name}</span>
              <span className="block text-sm text-muted">{[c.phone, c.email].filter(Boolean).join(", ")}</span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
