import { flashMessages, statusLabels } from "@/lib/admin/format";

export const inputClass =
  "mt-1.5 block min-h-11 w-full border border-line bg-white px-3 text-espresso outline-none focus:border-espresso";
export const btnSolid =
  "label inline-flex min-h-11 items-center justify-center bg-espresso px-5 text-white transition-colors hover:bg-taupe";
export const btnOutline =
  "label inline-flex min-h-11 items-center justify-center border border-espresso px-5 text-espresso transition-colors hover:bg-espresso hover:text-white";

export function AdminTitle({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <h1 className="text-3xl font-light text-espresso md:text-4xl">{children}</h1>
      {action}
    </div>
  );
}

export function Flash({ code }: { code?: string }) {
  const m = code ? flashMessages[code] : undefined;
  if (!m) return null;
  return (
    <p role={m.error ? "alert" : "status"} className={`mb-6 border p-4 ${m.error ? "border-espresso bg-white text-espresso" : "border-line bg-white text-muted"}`}>
      {m.text}
    </p>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const tone =
    status === "cancelled" || status === "no_show"
      ? "border-line text-muted line-through decoration-muted/50"
      : status === "completed"
        ? "border-taupe text-taupe"
        : "border-espresso text-espresso";
  return <span className={`label inline-block border px-2 py-1 !text-[0.6rem] ${tone}`}>{statusLabels[status] ?? status}</span>;
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
  return <p className="text-muted">Wird geladen …</p>;
}
