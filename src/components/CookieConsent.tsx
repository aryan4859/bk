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

  useEffect(() => {
    if (!read()) queueMicrotask(() => setOpen(true));
    const show = () => setOpen(true);
    window.addEventListener(OPEN_EVENT, show);
    return () => window.removeEventListener(OPEN_EVENT, show);
  }, []);

  useEffect(() => { if (open) first.current?.focus(); }, [open]);

  if (!open) return null;
  const choose = (v: "all" | "essential") => { write(v); setOpen(false); };

  return (
    <div
      role="dialog"
      aria-labelledby="cookie-title"
      aria-describedby="cookie-desc"
      onKeyDown={(e) => { if (e.key === "Escape") setOpen(false); }}
      className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-3xl rounded-lg border border-line bg-surface p-5 shadow-pop sm:bottom-5"
    >
      <h2 id="cookie-title" className="font-display text-xl font-semibold">Cookies</h2>
      <p id="cookie-desc" className="mt-1 text-[15px] text-muted">
        We use one essential cookie to keep you logged in. We would only use optional cookies (such as analytics or embedded maps) if you accept them, and we do not use any yet.
        See the <Link href="/cookies" className="text-brand underline">cookie policy</Link> and <Link href="/privacy" className="text-brand underline">privacy policy</Link>.
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <button ref={first} type="button" onClick={() => choose("all")} className="btn-primary">Accept all</button>
        <button type="button" onClick={() => choose("essential")} className="btn-outline">Essential only</button>
      </div>
    </div>
  );
}
