"use client";

import { useEffect, useRef } from "react";
import { Emblem, Lettering } from "./logo/Logo";
import { EMBLEM } from "./logo/logo-paths";

const FLIGHT_MS = 850;

/**
 * Opening logo: the emblem and then the lettering are traced like a pen drawing them and filled in. Then each part
 * flies onto its twin in the header logo (same artwork, so they land exactly) while the cover fades, and hands over.
 */
export function Preloader() {
  const cover = useRef<HTMLDivElement>(null);
  const art = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const html = document.documentElement;
    const bg = cover.current, box = art.current;
    if (html.dataset.preload !== "run" || !bg || !box) return;

    let started = false;
    const end = () => { delete html.dataset.preload; };
    const fly = async () => {
      if (started) return;
      started = true;
      const pairs = (["mark", "text"] as const).map((part) => [
        box.querySelector<SVGSVGElement>(`[data-part=${part}]`),
        document.querySelector<SVGSVGElement>(`[data-logo-${part}]`),
      ] as const);
      if (pairs.some(([from, to]) => !from || !to || !to.getBoundingClientRect().width)) {
        bg.animate({ opacity: [1, 0] }, 300).finished.then(end, end);
        return;
      }
      const easing = "cubic-bezier(0.65, 0, 0.35, 1)";
      bg.animate({ backgroundColor: ["var(--color-canvas)", "transparent"] }, { duration: FLIGHT_MS, easing, fill: "forwards" });
      await Promise.all(pairs.map(([from, to]) => {
        const a = from!.getBoundingClientRect(), b = to!.getBoundingClientRect();
        const move = `translate(${b.left - a.left}px, ${b.top - a.top}px) scale(${b.width / a.width})`;
        return from!.animate({ transform: ["none", move] }, { duration: FLIGHT_MS, easing, fill: "forwards" }).finished;
      }));
      html.dataset.preload = "leaving"; // the real logo fades in under the drawing
      await box.animate({ opacity: [1, 0] }, { duration: 300, fill: "forwards" }).finished;
      end();
    };

    const last = box.querySelector("[data-part=text] path:last-of-type");
    const done = (e: Event) => { if ((e as AnimationEvent).animationName === "logo-fill") void fly(); };
    last?.addEventListener("animationend", done);
    const bail = setTimeout(() => void fly(), 4500); // background tabs may never fire animationend
    return () => { last?.removeEventListener("animationend", done); clearTimeout(bail); };
  }, []);

  return (
    <div ref={cover} className="preloader bg-canvas" aria-hidden>
      <div ref={art} data-state="drawing" className="flex flex-col items-center gap-[min(4vw,1.75rem)] text-ink">
        <Emblem draw data-part="mark" className="h-auto w-[min(30vw,9.5rem)]" />
        <Lettering draw offset={EMBLEM.shapes.length} data-part="text" className="h-auto w-[min(78vw,26rem)]" />
      </div>
    </div>
  );
}
