"use client";

import { useEffect, useState } from "react";
import type { Flash } from "@/lib/flash";
import { Icon } from "./Icon";

// Rendered with key={flash.id}, so each new message gets a fresh instance.
export function Toast({ flash }: { flash: Flash }) {
  const [open, setOpen] = useState(true);
  useEffect(() => {
    document.cookie = "flash=; Max-Age=0; Path=/";
    const t = setTimeout(() => setOpen(false), 6000);
    return () => clearTimeout(t);
  }, []);
  if (!open) return null;
  const ok = flash.tone === "ok";
  return (
    <div role={ok ? "status" : "alert"} className={`fixed left-1/2 top-20 z-[60] flex w-[calc(100%-1.5rem)] max-w-md -translate-x-1/2 items-start gap-3 rounded-xl bg-canvas px-4 py-3 text-base shadow-pop ${ok ? "text-ok" : "text-error"}`}>
      <Icon name={ok ? "check" : "alert"} className="mt-0.5 size-5 shrink-0" />
      <span className="flex-1 text-ink">{flash.msg}</span>
      <button type="button" onClick={() => setOpen(false)} aria-label="Dismiss message" className="-m-1 rounded-full p-1 text-muted hover:text-ink"><Icon name="close" /></button>
    </div>
  );
}
