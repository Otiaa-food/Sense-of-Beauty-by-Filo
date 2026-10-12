"use client";

import { useActionState } from "react";
import { login, type LoginState } from "./actions";
import { inputClass as field } from "@/components/admin/ui";

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, {});
  return (
    <form action={action} className="mt-10 space-y-6">
      {state.message ? (
        <p role="alert" className="rounded-2xl border border-cocoa/40 bg-white p-4 text-espresso">
          {state.message}
        </p>
      ) : null}
      <div>
        <label htmlFor="email" className="label text-muted">E-Mail</label>
        <input id="email" name="email" type="email" autoComplete="username" required defaultValue={state.email} className={field} />
      </div>
      <div>
        <label htmlFor="password" className="label text-muted">Passwort</label>
        <input id="password" name="password" type="password" autoComplete="current-password" required className={field} />
      </div>
      <button type="submit" disabled={pending} className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-espresso px-8 text-sm font-medium text-white transition-colors hover:bg-cocoa disabled:opacity-60">
        {pending ? "Einen Moment …" : "Anmelden"}
      </button>
    </form>
  );
}
