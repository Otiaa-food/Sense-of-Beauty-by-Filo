import type { LucideIcon } from "lucide-react";
import { flashMessages, statusLabels } from "@/lib/admin/format";

/*
 * Bausteine für den Admin-Bereich: warme Beige-Töne, runde Karten, Knöpfe als Pillen.
 * Die Website selbst bleibt eckig (Lumo-Stil), nur das Admin ist weicher.
 */

export const inputClass =
  "mt-1.5 block min-h-11 w-full rounded-xl border border-card-line bg-white px-3.5 text-espresso outline-none transition-colors focus:border-cocoa focus:ring-2 focus:ring-blush";
export const btnSolid =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-espresso px-5 text-sm font-medium text-white transition-colors hover:bg-cocoa disabled:opacity-50";
export const btnOutline =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-card-line bg-card px-5 text-sm font-medium text-espresso transition-colors hover:border-cocoa hover:text-cocoa";
export const btnIcon =
  "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-card-line bg-card text-espresso transition-colors hover:border-cocoa hover:text-cocoa";
export const btnSoft =
  "inline-flex min-h-10 items-center justify-center gap-2 rounded-full bg-blush px-4 text-sm font-medium text-cocoa transition-colors hover:bg-caramel/40";
export const linkSoft = "text-sm text-muted underline decoration-card-line underline-offset-4 hover:text-cocoa";

export function AdminTitle({ children, action, subtitle }: { children: React.ReactNode; action?: React.ReactNode; subtitle?: React.ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-3xl font-light text-espresso md:text-[2.4rem]">{children}</h1>
        {subtitle ? <p className="mt-1.5 text-sm text-muted">{subtitle}</p> : null}
      </div>
      {action}
    </div>
  );
}

/** Karte mit optionalem Kopf (Icon + Titel + Aktion rechts) */
export function Card({
  title,
  icon: Icon,
  action,
  children,
  className = "",
  bodyClassName = "p-5 md:p-6",
}: {
  title?: React.ReactNode;
  icon?: LucideIcon;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={`card ${className}`}>
      {title ? (
        <div className="flex items-center justify-between gap-3 px-5 pt-5 md:px-6">
          <h2 className="flex items-center gap-2.5 text-base font-medium text-espresso">
            {Icon ? (
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blush text-cocoa">
                <Icon size={16} strokeWidth={1.75} aria-hidden="true" />
              </span>
            ) : null}
            {title}
          </h2>
          {action}
        </div>
      ) : null}
      <div className={bodyClassName}>{children}</div>
    </section>
  );
}

export function Flash({ code }: { code?: string }) {
  const m = code ? flashMessages[code] : undefined;
  if (!m) return null;
  return (
    <p
      role={m.error ? "alert" : "status"}
      className={`anim-fade-up mb-6 rounded-2xl border p-4 text-sm ${m.error ? "border-cocoa/40 bg-white text-espresso" : "border-card-line bg-card text-muted"}`}
    >
      {m.text}
    </p>
  );
}

const statusTone: Record<string, string> = {
  confirmed: "bg-espresso/90 text-white",
  pending: "bg-caramel/30 text-cocoa",
  completed: "bg-[#e3efe9] text-[#24564d]",
  cancelled: "bg-stone text-muted line-through decoration-muted/50",
  no_show: "bg-[#f4dfd6] text-[#7a3518]",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-[0.7rem] font-medium ${statusTone[status] ?? "bg-stone text-muted"}`}>
      {statusLabels[status] ?? status}
    </span>
  );
}

export function Field({
  label,
  name,
  type = "text",
  defaultValue,
  required,
  children,
  ...rest
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string | number;
  required?: boolean;
  children?: React.ReactNode;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="label text-muted">{label}</span>
      {children ?? <input name={name} type={type} defaultValue={defaultValue} required={required} className={inputClass} {...rest} />}
    </label>
  );
}

export function Loading() {
  return (
    <div className="grid gap-4 md:grid-cols-3" aria-label="Wird geladen">
      {[0, 1, 2].map((i) => (
        <div key={i} className="card h-28 animate-pulse" />
      ))}
    </div>
  );
}
