"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const NAME = "consent";
const OPEN_EVENT = "open-cookie-settings";

function read() {
  return document.cookie.split("; ").find((c) => c.startsWith(`${NAME}=`))?.split("=")[1] ?? null;
}
function write(value: "all" | "essential") {
  document.cookie = `${NAME}=${value}; Max-Age=${60 * 60 * 24 * 180}; Path=/; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`;
}

export function CookieSettingsButton({ className = "btn-outline", children = "Change cookie settings" }: { className?: string; children?: React.ReactNode }) {
  return (
    <button type="button" className={className} onClick={() => window.dispatchEvent(new Event(OPEN_EVENT))}>
      {children}
    </button>
  );
}

export function CookieConsent() {
  const [open, setOpen] = useState(false);
  const first = useRef<HTMLButtonElement>(null);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!read()) queueMicrotask(() => setOpen(true));
    const show = () => setOpen(true);
    window.addEventListener(OPEN_EVENT, show);
    return () => window.removeEventListener(OPEN_EVENT, show);
  }, []);

  useEffect(() => { if (open) first.current?.focus(); }, [open]);

  // publish the notice's height so other bottom-corner controls (the assistant button) sit above it, not under it
  useEffect(() => {
    const root = document.documentElement;
    const el = box.current;
    if (!open || !el) { root.style.removeProperty("--cookie-notice"); return; }
    const sync = () => root.style.setProperty("--cookie-notice", `${Math.ceil(el.getBoundingClientRect().height) + 12}px`);
    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    return () => { ro.disconnect(); root.style.removeProperty("--cookie-notice"); };
  }, [open]);

  if (!open) return null;
  const choose = (v: "all" | "essential") => { write(v); setOpen(false); };

  return (
    <div
      ref={box}
      role="dialog"
      aria-labelledby="cookie-title"
      aria-describedby="cookie-desc"
      onKeyDown={(e) => { if (e.key === "Escape") setOpen(false); }}
      className="fixed inset-x-3 bottom-[calc(var(--tab-bar,0px)+var(--compare-bar,0px)+0.75rem)] z-50 rounded-lg bg-dark p-6 text-on-dark-soft shadow-pop sm:inset-x-auto sm:bottom-[calc(var(--tab-bar,0px)+var(--compare-bar,0px)+1.25rem)] sm:right-5 sm:max-w-sm"
    >
      <h2 id="cookie-title" className="text-xl text-on-dark">Cookies</h2>
      <p id="cookie-desc" className="mt-2 text-sm">
        We use one essential cookie to keep you logged in. We would only use optional cookies (such as analytics or embedded maps) if you accept them, and we do not use any yet.
        See the <Link href="/cookies" className="text-on-dark underline underline-offset-4">cookie policy</Link> and <Link href="/privacy" className="text-on-dark underline underline-offset-4">privacy policy</Link>.
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <button ref={first} type="button" onClick={() => choose("all")} className="btn-primary">Accept all</button>
        <button type="button" onClick={() => choose("essential")} className="btn-on-dark">Essential only</button>
      </div>
    </div>
  );
}
