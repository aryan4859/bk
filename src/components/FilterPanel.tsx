"use client";

import { useEffect, useRef } from "react";

// Collapsed by default on phones so results come first; always open on large screens.
export function FilterPanel({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const sync = () => { if (ref.current) ref.current.open = mq.matches; };
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  return (
    <details ref={ref} className="rounded-lg border border-line bg-surface p-5 lg:[&>summary]:hidden">
      <summary className="btn-outline w-full lg:hidden">Filters and sorting</summary>
      <div className="mt-4 lg:mt-0">{children}</div>
    </details>
  );
}
