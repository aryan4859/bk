import Link from "next/link";

/** "Explore by budget": the price bands as large figures with live counts, on the dark surface. */
export function BudgetBands({ bands }: { bands: { key: string; label: string; count: number }[] }) {
  return (
    <section className="bg-dark py-20 text-on-dark sm:py-24" aria-labelledby="budget">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 id="budget" data-reveal className="text-[32px] text-on-dark sm:text-[44px]">Explore by budget</h2>
        <p data-reveal style={{ "--i": 1 } as React.CSSProperties} className="mt-3 max-w-xl text-on-dark-soft">Every price band, with how many bikes are for sale in it right now.</p>
        <ul className="mt-10 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          {bands.map((b, i) => (
            <li key={b.key} data-reveal style={{ "--i": i + 1 } as React.CSSProperties}>
              <Link href={`/listings?budget=${b.key}`} className="group flex h-full flex-col justify-between gap-6 rounded-xl bg-dark-2 p-5 transition-colors duration-150 hover:bg-black sm:min-h-44">
                <span className="font-display text-[28px] leading-[1.05] lining-nums text-on-dark">{b.label}</span>
                <span className="flex items-center justify-between text-sm">
                  <span className={b.count ? "text-on-dark" : "text-on-dark-soft"}>{b.count === 0 ? "None right now" : `${b.count} ${b.count === 1 ? "bike" : "bikes"}`}</span>
                  <span aria-hidden className="text-accent transition-transform duration-150 group-hover:translate-x-1">→</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
