import Link from "next/link";

/** "What's your budget?": the price bands with live counts, as a row of paper tiles. */
export function BudgetBands({ bands }: { bands: { key: string; label: string; count: number }[] }) {
  return (
    <section className="border-t border-line py-16 sm:py-20" aria-labelledby="budget">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 id="budget" data-reveal className="text-2xl sm:text-3xl">What&apos;s your budget?</h2>
        <p data-reveal style={{ "--i": 1 } as React.CSSProperties} className="mt-2 max-w-xl text-muted">Pick a range and see what that money gets you right now.</p>
        <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {bands.map((b, i) => (
            <li key={b.key} data-reveal style={{ "--i": i + 1 } as React.CSSProperties}>
              <Link href={`/listings?budget=${b.key}`} className="group flex h-full flex-col justify-between gap-6 rounded-xl border border-line p-5 transition-colors duration-150 bg-raised hover:border-ink sm:min-h-36">
                <span className="font-display text-2xl leading-tight text-ink">{b.label}</span>
                <span className="flex items-center justify-between text-sm text-muted">
                  <span>{b.count === 0 ? "None right now" : `${b.count} ${b.count === 1 ? "bike" : "bikes"}`}</span>
                  <span aria-hidden className="text-ink transition-transform duration-150 group-hover:translate-x-1">→</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
