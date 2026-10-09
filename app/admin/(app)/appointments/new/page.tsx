import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminTitle, Loading } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin/auth";
import { dateToLocal } from "@/lib/admin/time";
import { brand } from "@/lib/brand.config";
import { NewAppointmentForm } from "./NewAppointmentForm";

export const metadata: Metadata = { title: "Termin eintragen" };

type Props = { searchParams: Promise<{ kunde?: string; tag?: string }> };

export default function NewAppointmentPage(props: Props) {
  return (
    <>
      <AdminTitle>Termin eintragen</AdminTitle>
      <Suspense fallback={<Loading />}>
        <Content {...props} />
      </Suspense>
    </>
  );
}

async function Content({ searchParams }: Props) {
  const { supabase } = await requireAdmin();
  const { kunde, tag } = await searchParams;
  const [{ data: services }, customerRes] = await Promise.all([
    supabase
      .from("services")
      .select("id, name, duration_minutes, sort_order, service_categories(name)")
      .eq("active", true)
      .order("sort_order"),
    kunde
      ? supabase.from("customers").select("id, first_name, last_name, email, phone").eq("id", kunde).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);
  const list = (services ?? []).map((s) => ({
    id: s.id as string,
    name: s.name as string,
    duration_minutes: s.duration_minutes as number,
    category: ((s.service_categories as unknown as { name: string } | null)?.name ?? "Weitere") as string,
  }));
  const day = tag && /^\d{4}-\d{2}-\d{2}$/.test(tag) ? tag : dateToLocal(new Date(), brand.timezone).date;
  return <NewAppointmentForm services={list} customer={customerRes.data ?? null} day={day} />;
}
