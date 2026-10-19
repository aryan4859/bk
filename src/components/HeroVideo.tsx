"use client";

import { useEffect, useRef } from "react";

const VIDEOS = ["/videos/yezdi-roadster.mp4", "/videos/tvs-radeon.mp4", "/videos/tvs-apache-rtx.mp4"] as const;

const pick = (from: readonly string[]) => from[Math.floor(Math.random() * from.length)];

/**
 * A muted background video behind the hero, picked at random and followed by another random one when it ends.
 * The source is set after mount so the server and client HTML match, and never set for people who ask for
 * reduced motion or less data: they keep the plain dark band.
 */
export function HeroVideo() {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current;
    const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
    if (!video || window.matchMedia("(prefers-reduced-motion: reduce)").matches || saveData) return;
    // a video holds the page's load event (and the tab's spinner) until its first frame arrives, so it only
    // starts once the page itself has finished loading
    const start = () => { video.src = pick(VIDEOS); video.play().catch(() => {}); };
    if (document.readyState === "complete") { start(); return; }
    window.addEventListener("load", start, { once: true });
    return () => window.removeEventListener("load", start);
  }, []);

  // a different video from the one that just finished
  function next(e: React.SyntheticEvent<HTMLVideoElement>) {
    const video = e.currentTarget;
    video.src = pick(VIDEOS.filter((v) => !video.src.endsWith(v)));
    video.play().catch(() => {});
  }

  return (
    <video
      ref={ref}
      autoPlay
      muted
      playsInline
      preload="none"
      onEnded={next}
      aria-hidden
      tabIndex={-1}
      className="absolute inset-0 h-full w-full object-cover"
    />
  );
}
