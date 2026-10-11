import type { Metadata } from "next";
import { Suspense } from "react";
import { Logo } from "@/components/public/Logo";
import { createClient } from "@/lib/supabase/server";
import { logout } from "./actions";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Anmelden" };

type Props = { searchParams: Promise<{ fehler?: string }> };

export default function LoginPage(props: Props) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center px-5 py-16">
      <Logo />
      <h1 className="mt-12 text-3xl font-light text-espresso">Admin-Bereich</h1>
      <Suspense fallback={null}>
        <NoAccess {...props} />
      </Suspense>
      <LoginForm />
    </div>
  );
}

async function NoAccess({ searchParams }: Props) {
  const { fehler } = await searchParams;
  if (fehler !== "kein-zugang" && fehler !== "pruefung") return null;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return (
    <div role="alert" className="mt-6 border border-line bg-white p-4 text-muted">
      <p>
        {fehler === "pruefung"
          ? "Der Zugang konnte gerade nicht geprüft werden. Bitte später noch einmal versuchen."
          : "Dieses Konto ist eingeloggt, aber noch nicht für den Admin-Bereich freigeschaltet."}
      </p>
      {user ? (
        <>
          <p className="mt-3 text-sm">
            Angemeldet als <span className="text-espresso">{user.email}</span>
          </p>
          <form action={logout} className="mt-3">
            <button type="submit" className="label text-espresso underline underline-offset-4">Abmelden</button>
          </form>
        </>
      ) : null}
    </div>
  );
}
