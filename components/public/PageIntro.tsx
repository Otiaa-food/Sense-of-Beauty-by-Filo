/** Einheitlicher Seitenanfang: große dünne Überschrift, kurzer Text. */
export function PageIntro({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="max-w-3xl">
      <h1 className="text-[2.6rem] font-light leading-[1.08] text-espresso md:text-6xl">{title}</h1>
      {children ? <div className="mt-6 space-y-4 text-[1rem] leading-[1.85] text-muted">{children}</div> : null}
    </div>
  );
}
