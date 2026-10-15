"use client";

import { useEffect, useRef } from "react";
import { WORDMARK } from "./wordmark-paths";

/**
 * The footer's closing "Sawari", drawn letter by letter like a pen tracing it (the stroke-drawing effect
 * anime.js calls createDrawable, done with plain CSS on pathLength=1). Draws once when it scrolls into
 * view and again on hover. Without script, or with reduced motion, the letters are simply solid.
 */
export function FooterWordmark({ className = "" }: { className?: string }) {
  const svg = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const el = svg.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) return;
    const draw = () => {
      el.dataset.state = "hidden";
      void el.getBoundingClientRect(); // restart the CSS animations
      requestAnimationFrame(() => { el.dataset.state = "drawing"; });
    };
    el.dataset.state = "hidden";
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { draw(); io.disconnect(); } }, { threshold: 0.4 });
    io.observe(el);
    const last = el.querySelector("path:last-of-type");
    const done = (e: Event) => { if ((e as AnimationEvent).animationName === "wm-fill") el.dataset.state = "drawn"; };
    last?.addEventListener("animationend", done);
    el.addEventListener("pointerenter", draw);
    return () => { io.disconnect(); last?.removeEventListener("animationend", done); el.removeEventListener("pointerenter", draw); };
  }, []);

  return (
    <svg ref={svg} viewBox={WORDMARK.viewBox} className={`wordmark ${className}`} aria-hidden focusable="false">
      {WORDMARK.letters.map((l, i) => (
        <path key={i} d={l.d} pathLength={1} style={{ "--i": i } as React.CSSProperties} />
      ))}
    </svg>
  );
}

