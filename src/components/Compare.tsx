"use client";

import Link from "next/link";
import { useEffect, useSyncExternalStore } from "react";
import { COMPARE_MAX } from "@/lib/compare";
import { Icon } from "./Icon";

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
      className={`inline-flex min-h-9 min-w-9 items-center justify-center gap-1 rounded-full px-2.5 text-xs font-medium transition-[transform,background-color] duration-150 active:scale-95 ${on ? "bg-dark text-on-dark" : "bg-canvas text-ink"} disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    >
      <Icon name={on ? "check" : "plus"} className="size-4" /><span className={wide ? "" : "hidden sm:inline"}>Compare</span>
    </button>
  );
}

export function CompareBar() {
  const ids = useCompareIds();
  const visible = ids.length > 0;
  useEffect(() => {
    const root = document.documentElement;
    if (visible) root.style.setProperty("--compare-bar", "4rem");
    else root.style.removeProperty("--compare-bar");
    return () => { root.style.removeProperty("--compare-bar"); };
  }, [visible]);
  if (!visible) return null;
  return (
    <>
    {/* keeps the bottom of the page reachable behind the fixed bar */}
    <div aria-hidden className="h-20" />
    <div role="region" aria-label="Compare bikes" className="fixed inset-x-0 bottom-[var(--tab-bar,0px)] z-40 bg-dark px-4 py-3 text-on-dark sm:px-6">
      <div className="mx-auto flex max-w-6xl items-center gap-3 sm:gap-4">
        <span className="text-sm">{ids.length} {ids.length === 1 ? "bike" : "bikes"} selected{ids.length < 2 && <span className="hidden text-on-dark-soft sm:inline">, pick at least 2</span>}</span>
        <button type="button" onClick={() => write([])} className="text-sm text-on-dark-soft underline-offset-4 hover:text-on-dark hover:underline">Clear</button>
        {ids.length >= 2 ? (
          <Link href={`/compare?ids=${ids.join(",")}`} className="btn-primary ml-auto whitespace-nowrap"><span>Compare<span className="hidden sm:inline"> now</span></span></Link>
        ) : (
          <span className="btn-primary ml-auto cursor-not-allowed whitespace-nowrap opacity-50" aria-disabled><span>Compare<span className="hidden sm:inline"> now</span></span></span>
        )}
      </div>
    </div>
    </>
  );
}
