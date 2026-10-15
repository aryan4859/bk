export function PageHero({ title, subtitle, children }: { title: React.ReactNode; subtitle?: string; children?: React.ReactNode }) {
  return (
    <section className="bg-wash">
      <div className="mx-auto flex max-w-6xl flex-wrap items-end justify-between gap-6 px-4 py-12 sm:px-6 sm:py-16">
        <div>
          <h1 className="text-[40px] sm:text-[56px]">{title}</h1>
          {subtitle && <p className="mt-3 max-w-xl text-lg text-body">{subtitle}</p>}
        </div>
        {children}
      </div>
    </section>
  );
}
