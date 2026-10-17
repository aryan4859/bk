export function PageHero({ title, subtitle, children }: { title: React.ReactNode; subtitle?: string; children?: React.ReactNode }) {
  return (
    <section className="border-b border-line bg-raised">
      <div className="mx-auto flex max-w-6xl flex-wrap items-end justify-between gap-6 px-4 py-7 sm:px-6 sm:py-9">
        <div>
          <h1 className="text-[26px] sm:text-[32px]">{title}</h1>
          {subtitle && <p className="mt-1 max-w-xl text-muted">{subtitle}</p>}
        </div>
        {children}
      </div>
    </section>
  );
}
