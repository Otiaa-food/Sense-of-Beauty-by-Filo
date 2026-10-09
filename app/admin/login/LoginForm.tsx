"use client";

import { useActionState } from "react";
import { login, type LoginState } from "./actions";

const field = "mt-2 block min-h-12 w-full border border-line bg-white px-4 text-espresso outline-none focus:border-espresso";

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, {});
  return (
    <form action={action} className="mt-10 space-y-6">
      {state.message ? (
        <p role="alert" className="border border-espresso bg-white p-4 text-espresso">
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
      <button type="submit" disabled={pending} className="label inline-flex min-h-12 w-full items-center justify-center bg-espresso px-8 text-white hover:bg-taupe disabled:opacity-60">
        {pending ? "Einen Moment …" : "Anmelden"}
      </button>
    </form>
  );
}
