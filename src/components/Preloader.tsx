"use client";

import { useEffect, useRef } from "react";
import { WORDMARK } from "./footer/wordmark-paths";

const FLIGHT_MS = 850;

/**
 * Runs in <head> before first paint: every full page load (with motion allowed) gets the intro.
 * Without it the preloader stays display:none, so no-script and reduced-motion visitors never see it.
 */
export const preloadScript = `try{if(!matchMedia("(prefers-reduced-motion: reduce)").matches)document.documentElement.dataset.preload="run"}catch(e){}`;

/**
 * Opening "Sawari", drawn like the footer wordmark. Once the last letter fills, the drawing flies into the
 * header logo (same font, so the letters land on the real text) while the cover fades, then hands over to it.
 */
export function Preloader() {
  const cover = useRef<HTMLDivElement>(null);
  const svg = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const html = document.documentElement;
    const bg = cover.current, mark = svg.current;
    if (html.dataset.preload !== "run" || !bg || !mark) return;

    let started = false;
    const end = () => { delete html.dataset.preload; };
    const fly = async () => {
      if (started) return;
      started = true;
      await document.fonts?.ready;
      const logo = document.querySelector<HTMLElement>("[data-logo]");
      const from = mark.getBoundingClientRect();
      if (!logo || !from.width) { bg.animate({ opacity: [1, 0] }, 300).finished.then(end, end); return; }

      // the outlines were made at 200px with the baseline at y=200 and the pen starting at x=0 (scripts/make-wordmark.mjs)
      const [vbX, vbY, vbW] = WORDMARK.viewBox.split(" ").map(Number);
      const to = logo.getBoundingClientRect();
      const css = getComputedStyle(logo);
      const px = parseFloat(css.fontSize);
      const ctx = document.createElement("canvas").getContext("2d");
      let baseline = to.top + to.height * 0.8;
      if (ctx) {
        ctx.font = `${css.fontWeight} ${css.fontSize} ${css.fontFamily}`;
        const m = ctx.measureText(WORDMARK.text);
        if (m.fontBoundingBoxAscent) baseline = to.top + (to.height - m.fontBoundingBoxAscent - m.fontBoundingBoxDescent) / 2 + m.fontBoundingBoxAscent;
      }
      const s = px / 200;
      const scale = s / (from.width / vbW);
      const dx = to.left + vbX * s - from.left;
      const dy = baseline + (vbY - 200) * s - from.top;

      const easing = "cubic-bezier(0.65, 0, 0.35, 1)";
      bg.animate({ backgroundColor: ["var(--color-canvas)", "transparent"] }, { duration: FLIGHT_MS, easing, fill: "forwards" });
      // land each letter on the matching header letter where the browser actually set it: its kerning, tracking and
      // pixel snapping differ from the outlines' (which carry the footer's -0.04em tracking), so read them, not predict them
      const text = logo.firstChild;
      const pens = text instanceof Text && text.data.length === WORDMARK.letters.length
        ? WORDMARK.letters.map((_, i) => { const r = document.createRange(); r.setStart(text, i); r.setEnd(text, i + 1); return r.getBoundingClientRect().left; })
        : null;
      mark.querySelectorAll("path").forEach((path, i) => {
        const shift = pens ? (pens[i] - to.left) / s - WORDMARK.letters[i].x : 0;
        path.animate({ transform: ["none", `translateX(${shift}px)`] }, { duration: FLIGHT_MS, easing, fill: "forwards" });
      });
      await mark.animate({ transform: ["none", `translate(${dx}px, ${dy}px) scale(${scale})`] }, { duration: FLIGHT_MS, easing, fill: "forwards" }).finished;
      html.dataset.preload = "leaving"; // the real logo fades in under the drawing
      await mark.animate({ opacity: [1, 0] }, { duration: 300, fill: "forwards" }).finished;
      end();
    };

    const last = mark.querySelector("path:last-of-type");
    const done = (e: Event) => { if ((e as AnimationEvent).animationName === "wm-fill") void fly(); };
    last?.addEventListener("animationend", done);
    const bail = setTimeout(() => void fly(), 4500); // background tabs may never fire animationend
    return () => { last?.removeEventListener("animationend", done); clearTimeout(bail); };
  }, []);

  return (
    <div ref={cover} className="preloader bg-canvas" aria-hidden>
      <svg ref={svg} viewBox={WORDMARK.viewBox} data-state="drawing" className="wordmark w-[min(72vw,34rem)] text-ink" focusable="false">
        {WORDMARK.letters.map((l, i) => (
          <path key={i} d={l.d} pathLength={1} style={{ "--i": i } as React.CSSProperties} />
        ))}
      </svg>
    </div>
  );
}
