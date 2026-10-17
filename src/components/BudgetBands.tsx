import Link from "next/link";

/** "Shop by budget": the price bands with how many bikes are in each right now. */
export function BudgetBands({ bands }: { bands: { key: string; label: string; count: number }[] }) {
  return (
    <section className="mx-auto max-w-6xl px-4 pt-10 sm:px-6 sm:pt-12" aria-labelledby="budget">
      <h2 id="budget" className="mb-4 text-xl sm:text-2xl">Shop by budget</h2>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {bands.map((b) => (
          <li key={b.key}>
            <Link href={`/listings?budget=${b.key}`} className="group block h-full rounded-lg border border-line bg-raised px-4 py-3.5 transition-colors hover:border-field">
              <span className="block font-semibold text-ink group-hover:text-brand">{b.label}</span>
              <span className="mt-0.5 block text-sm text-muted">{b.count === 0 ? "None right now" : `${b.count} ${b.count === 1 ? "bike" : "bikes"}`}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
