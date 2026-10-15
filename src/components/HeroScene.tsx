"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { formatNpr } from "@/lib/format";

export type HeroCard = { id: string; title: string; priceNpr: number; url: string };

// Depth of each layer in px along the z axis. Farther layers are scaled up so their edges
// never show when the scene tilts.
const PERSPECTIVE = 900;
const z = (depth: number) => ({
  // --sy is how far (px) the scene sits above the middle of the screen: near layers rise faster than the page, far ones lag
  transform: `translate3d(0, calc(var(--sy) * ${(depth * -0.001).toFixed(4)}px), ${depth}px) scale(${depth <= 0 ? (1 + -depth / PERSPECTIVE + 0.08).toFixed(3) : 1})`,
});

// Where each floating card sits and how it is turned. The first one is the largest and nearest.
const CARD_POSES = [
  { box: "left-[7%] bottom-[13%] w-[40%] sm:w-[38%]", depth: 110, turn: "rotateY(14deg) rotateZ(-3deg)", delay: "0s" },
  { box: "right-[7%] bottom-[24%] w-[36%] sm:w-[34%]", depth: 70, turn: "rotateY(-16deg) rotateZ(2.5deg)", delay: "-2s" },
  { box: "hidden sm:block left-[40%] top-[9%] w-[26%]", depth: 35, turn: "rotateX(10deg) rotateZ(-1.5deg)", delay: "-4s" },
];

/**
 * Layered mountain-and-road scene with recently listed bikes floating in front.
 * Pointer movement tilts it in 3D (fine pointers only); scrolling slides the layers at different
 * speeds. Values are written to CSS variables from one rAF loop, so React never re-renders, and the
 * loop stops when the motion settles or the hero is off screen. Reduced motion gets a still scene.
 */
export function HeroScene({ cards }: { cards: HeroCard[] }) {
  const root = useRef<HTMLDivElement>(null);
  const [gone, setGone] = useState<string[]>([]); // cards whose photo failed to load

  useEffect(() => {
    const el = root.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const finePointer = window.matchMedia("(pointer: fine)").matches;
    const target = { x: 0, y: 0, s: 0 };
    const cur = { x: 0, y: 0, s: 0 };
    let frame = 0;
    let visible = true;

    const tick = () => {
      frame = 0;
      cur.x += (target.x - cur.x) * 0.08;
      cur.y += (target.y - cur.y) * 0.08;
      cur.s += (target.s - cur.s) * 0.15;
      el.style.setProperty("--px", cur.x.toFixed(4));
      el.style.setProperty("--py", cur.y.toFixed(4));
      el.style.setProperty("--sy", cur.s.toFixed(1));
      const moving = Math.abs(target.x - cur.x) + Math.abs(target.y - cur.y) > 0.001 || Math.abs(target.s - cur.s) > 0.5;
      if (moving && visible) frame = requestAnimationFrame(tick);
    };
    const kick = () => { if (!frame && visible) frame = requestAnimationFrame(tick); };

    const onPointer = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const r = el.getBoundingClientRect();
      // -1..1 from the scene's centre, eased off for far-away pointers
      target.x = Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width / 2)) / (window.innerWidth / 2)));
      target.y = Math.max(-1, Math.min(1, (e.clientY - (r.top + r.height / 2)) / (window.innerHeight / 2)));
      kick();
    };
    const onLeave = () => { target.x = 0; target.y = 0; kick(); };
    const onScroll = () => {
      const r = el.getBoundingClientRect();
      // 0 when the scene is centred on screen, so it always looks composed where people see it
      target.s = Math.max(-300, Math.min(300, window.innerHeight / 2 - (r.top + r.height / 2)));
      kick();
    };

    const io = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; if (visible) kick(); });
    io.observe(el);
    if (finePointer) {
      window.addEventListener("pointermove", onPointer, { passive: true });
      document.documentElement.addEventListener("pointerleave", onLeave);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    onScroll();
    el.dataset.live = "1";
    return () => {
      io.disconnect();
      window.removeEventListener("pointermove", onPointer);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div
      ref={root}
      className="hero-scene relative aspect-[16/11] w-full overflow-hidden rounded-2xl bg-card sm:aspect-[4/3]"
      style={{ perspective: `${PERSPECTIVE}px`, ["--px" as string]: 0, ["--py" as string]: 0, ["--sy" as string]: 0 }}
    >
      <div
        className="absolute inset-0"
        style={{
          transformStyle: "preserve-3d",
          transform: "rotateX(calc(var(--py) * -7deg)) rotateY(calc(var(--px) * 9deg))",
        }}
      >
        {/* sky and sun: flat cream, the sun is the scene's one coral shape */}
        <div aria-hidden className="absolute inset-0 bg-card" style={z(-160)}>
          <div className="absolute right-[18%] top-[13%] aspect-square w-[16%] rounded-full bg-accent" />
        </div>
        {/* far range, drawn as line art: cream fill, warm grey line, cream snow caps */}
        <svg aria-hidden viewBox="0 0 400 300" preserveAspectRatio="xMidYMax slice" className="absolute inset-0 h-full w-full" style={z(-100)}>
          <path className="fill-cream stroke-muted-soft" strokeWidth="1.2" strokeLinejoin="round" d="M-4 175 L38 136 L66 152 L108 98 L138 128 L176 78 L212 122 L246 101 L282 138 L322 88 L362 130 L404 108 V304 H-4Z" />
          <path className="fill-snow stroke-muted-soft" strokeWidth="1" strokeLinejoin="round" d="M108 98 L97 111 L104 108 L110 114 L118 109ZM176 78 L163 94 L171 90 L177 97 L186 90ZM322 88 L310 102 L318 99 L324 105 L332 100Z" />
        </svg>
        {/* near range: canvas fill with an ink line */}
        <svg aria-hidden viewBox="0 0 400 300" preserveAspectRatio="xMidYMax slice" className="absolute inset-0 h-full w-full" style={z(-55)}>
          <path className="fill-canvas stroke-ink" strokeWidth="1.6" strokeLinejoin="round" d="M-4 210 L46 170 L84 190 L128 152 L168 186 L214 162 L258 194 L300 168 L346 196 L404 172 V304 H-4Z" />
        </svg>
        {/* ground and the road into the hills: the dark surface, coral centre line */}
        <svg aria-hidden viewBox="0 0 400 300" preserveAspectRatio="xMidYMax slice" className="absolute inset-0 h-full w-full" style={z(0)}>
          <path className="fill-dark" d="M-4 238 Q200 214 404 238 V304 H-4Z" />
          <path className="fill-dark-2" d="M136 300 L196 227 L204 227 L264 300Z" />
          <path className="stroke-accent" strokeWidth="2.5" strokeDasharray="9 7" d="M200 300 V229" />
        </svg>
        {/* the bikes */}
        {cards.filter((c) => !gone.includes(c.id)).slice(0, CARD_POSES.length).map((c, i) => {
          const pose = CARD_POSES[i];
          return (
            <div key={c.id} className={`absolute ${pose.box}`} style={z(pose.depth)}>
              <Link
                href={`/listings/${c.id}`}
                className="hero-float group block rounded-xl bg-canvas p-1.5 outline-offset-4"
                style={{ transform: pose.turn, animationDelay: pose.delay }}
              >
                <span className="relative block aspect-[4/3] overflow-hidden rounded-lg bg-cream">
                  <Image src={c.url} alt={c.title} fill sizes="(min-width: 1024px) 220px, 40vw" priority={i === 0} onError={() => setGone((g) => [...g, c.id])} className="object-cover" />
                </span>
                <span className={`absolute -bottom-3 left-3 z-10 whitespace-nowrap rounded-md bg-dark px-2 py-0.5 font-display tabular-nums lining-nums text-on-dark ${i === 0 ? "text-lg" : "text-base"}`}>
                  {formatNpr(c.priceNpr)}
                </span>
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
