import type { Metadata } from "next";
import { Suspense } from "react";
import { Logo } from "@/components/public/Logo";
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
  if (fehler !== "kein-zugang") return null;
  return (
    <p role="alert" className="mt-6 border border-line bg-white p-4 text-muted">
      Dieses Konto hat keinen Zugang zum Admin-Bereich.
    </p>
  );
}
