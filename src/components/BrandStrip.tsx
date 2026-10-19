"use client";

import { useState } from "react";
import { BrandGrid } from "./BrandGrid";

/** The popular brands in one row; "All brands" in the heading opens the rest underneath. */
export function BrandStrip({ popular, rest }: { popular: readonly string[]; rest: readonly string[] }) {
  const [open, setOpen] = useState(false);
  return (
    <section aria-labelledby="brands" className="mx-auto max-w-6xl px-4 pt-10 sm:px-6 sm:pt-12">
      <div className="mb-4 flex items-baseline justify-between gap-4">
        <h2 id="brands" className="text-xl sm:text-2xl">Popular brands</h2>
        <button
          type="button"
          aria-expanded={open}
          aria-controls="more-brands"
          onClick={() => setOpen(!open)}
          className="shrink-0 text-sm font-medium text-brand hover:underline"
        >
          {open ? "Fewer brands ‹" : `All ${popular.length + rest.length} brands ›`}
        </button>
      </div>
      <BrandGrid brands={popular} cols="lg:grid-cols-6" />
      <div id="more-brands" hidden={!open} className="mt-3">
        <BrandGrid brands={rest} cols="lg:grid-cols-8" />
      </div>
    </section>
  );
}
