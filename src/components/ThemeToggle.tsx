"use client";

import { useSyncExternalStore } from "react";
import { THEME_KEY as KEY } from "@/lib/head-scripts";
import { Icon } from "./Icon";

type Theme = "light" | "dark";
const dark = () => window.matchMedia("(prefers-color-scheme: dark)");

const resolved = (): Theme => {
  const t = document.documentElement.dataset.theme;
  return t === "light" || t === "dark" ? t : dark().matches ? "dark" : "light";
};
const subscribe = (cb: () => void) => {
  const mq = dark();
  const mo = new MutationObserver(cb);
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  mq.addEventListener("change", cb);
  return () => { mo.disconnect(); mq.removeEventListener("change", cb); };
};

/** Light/dark switch. Choosing what the device already prefers clears the override, so the site follows the system again. */
export function ThemeToggle({ className = "" }: { className?: string }) {
  const theme = useSyncExternalStore(subscribe, resolved, () => null);
  const next: Theme = theme === "dark" ? "light" : "dark";
  const set = () => {
    const root = document.documentElement;
    const system: Theme = dark().matches ? "dark" : "light";
    try {
      if (next === system) { delete root.dataset.theme; localStorage.removeItem(KEY); }
      else { root.dataset.theme = next; localStorage.setItem(KEY, next); }
    } catch {
      root.dataset.theme = next; // storage blocked: still switch for this page view
    }
  };
  return (
    <button
      type="button"
      onClick={set}
      aria-label={theme ? `Switch to ${next} theme` : "Switch theme"}
      title={theme ? `Switch to ${next} theme` : undefined}
      className={`inline-flex size-10 shrink-0 items-center justify-center rounded-full text-ink transition-[transform,background-color] duration-150 hover:bg-wash active:scale-95 ${className}`}
    >
      <Icon name={theme === "dark" ? "sun" : "moon"} className="size-5" />
    </button>
  );
}
