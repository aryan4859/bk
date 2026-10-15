"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { COMPARE_MAX } from "@/lib/compare";

const KEY = "compare";
const EVT = "compare:change";

const read = () => {
  try { return localStorage.getItem(KEY) ?? "[]"; } catch { return "[]"; }
};
const subscribe = (cb: () => void) => {
  window.addEventListener(EVT, cb);
  window.addEventListener("storage", cb);
  return () => { window.removeEventListener(EVT, cb); window.removeEventListener("storage", cb); };
};
const parse = (raw: string): string[] => {
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string").slice(0, COMPARE_MAX) : [];
  } catch { return []; }
};
const write = (ids: string[]) => {
  try { localStorage.setItem(KEY, JSON.stringify(ids)); } catch { /* storage blocked: compare just won't persist */ }
  window.dispatchEvent(new Event(EVT));
};
const useCompareIds = () => parse(useSyncExternalStore(subscribe, read, () => "[]"));

export function CompareToggle({ id, label = "this bike", className = "", wide = false }: { id: string; label?: string; className?: string; wide?: boolean }) {
  const ids = useCompareIds();
  const on = ids.includes(id);
  const full = !on && ids.length >= COMPARE_MAX;
  return (
    <button
      type="button"
      aria-pressed={on}
      aria-label={`Compare ${label}`}
      disabled={full}
      title={full ? `You can compare up to ${COMPARE_MAX} bikes` : undefined}
      onClick={() => write(on ? ids.filter((x) => x !== id) : [...ids, id])}
      className={`inline-flex min-h-8 min-w-8 items-center justify-center gap-1 rounded-sm border px-2 py-1 text-xs font-medium ${on ? "border-ink bg-ink text-white" : "border-line bg-white text-ink hover:border-ink"} disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    >
      <span aria-hidden className="text-sm leading-none">{on ? "✓" : "+"}</span><span className={wide ? "" : "hidden sm:inline"}>Compare</span>
    </button>
  );
}

export function CompareBar() {
  const ids = useCompareIds();
  if (ids.length === 0) return null;
  return (
    <>
    {/* keeps the bottom of the page reachable behind the fixed bar */}
    <div aria-hidden className="h-20" />
    <div role="region" aria-label="Compare bikes" className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white px-4 py-3 sm:px-6 shadow-[0_-4px_12px_rgba(0,0,0,0.06)]">
      <div className="mx-auto flex max-w-6xl items-center gap-3 sm:gap-4">
        <span className="text-sm">{ids.length} {ids.length === 1 ? "bike" : "bikes"} selected{ids.length < 2 && <span className="hidden text-muted sm:inline"> · pick at least 2</span>}</span>
        <button type="button" onClick={() => write([])} className="text-sm text-muted underline-offset-4 hover:underline">Clear</button>
        {ids.length >= 2 ? (
          <Link href={`/compare?ids=${ids.join(",")}`} className="btn-primary ml-auto whitespace-nowrap">Compare<span className="hidden sm:inline">&nbsp;now</span></Link>
        ) : (
          <span className="btn-primary ml-auto cursor-not-allowed whitespace-nowrap opacity-50" aria-disabled>Compare<span className="hidden sm:inline">&nbsp;now</span></span>
        )}
      </div>
    </div>
    </>
  );
}
