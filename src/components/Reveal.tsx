"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * Entrances for anything marked `data-reveal`: it rises and fades in once as it scrolls into view,
 * staggered by its `--i` (0, 1, 2…). Content is only hidden after this script runs, and only if it is
 * below the fold, so nothing is ever stuck invisible and the first screen never flickers. Reduced
 * motion skips the travel entirely (see globals.css).
 */
export function Reveal() {
  const pathname = usePathname();
  useEffect(() => {
    const root = document.documentElement;
    if (!("IntersectionObserver" in window)) return;
    root.classList.add("reveal-ready");
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) if (e.isIntersecting) { (e.target as HTMLElement).dataset.shown = "1"; io.unobserve(e.target); }
    }, { rootMargin: "0px 0px -8% 0px" });
    // tracked per run (not on the element) so a re-run after cleanup observes everything again
    const watched = new WeakSet<Element>();
    const scan = () => {
      for (const el of document.querySelectorAll<HTMLElement>("[data-reveal]:not([data-shown])")) {
        if (watched.has(el)) continue;
        watched.add(el);
        if (el.getBoundingClientRect().top < window.innerHeight) el.dataset.shown = "1"; // already on screen: no entrance
        else io.observe(el);
      }
    };
    scan();
    // client-side navigations and streamed content add new elements
    const mo = new MutationObserver(scan);
    mo.observe(document.body, { childList: true, subtree: true });
    return () => { io.disconnect(); mo.disconnect(); };
  }, [pathname]);
  return null;
}
