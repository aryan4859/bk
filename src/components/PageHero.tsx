export function PageHero({ title, subtitle, children }: { title: React.ReactNode; subtitle?: string; children?: React.ReactNode }) {
  return (
    <section className="border-b border-line">
      <div className="mx-auto flex max-w-6xl flex-wrap items-end justify-between gap-6 px-6 py-10 sm:py-14">
        <div>
          <h1 className="text-4xl sm:text-5xl">{title}</h1>
          {subtitle && <p className="mt-3 max-w-xl text-muted">{subtitle}</p>}
        </div>
        {children}
      </div>
    </section>
  );
}
