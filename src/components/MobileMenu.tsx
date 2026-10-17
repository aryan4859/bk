"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type Props = { links: { href: string; label: string }[]; loggedIn: boolean; logout: () => Promise<void> };

export function MobileMenu({ links, loggedIn, logout }: Props) {
  const [openFor, setOpenFor] = useState<string | null>(null);
  const pathname = usePathname();
  const open = openFor === pathname; // navigating to another page closes the menu
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpenFor(null); };
    const onClick = (e: MouseEvent) => { if (!root.current?.contains(e.target as Node)) setOpenFor(null); };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => { document.removeEventListener("keydown", onKey); document.removeEventListener("mousedown", onClick); };
  }, [open]);

  return (
    <div ref={root} className="relative ml-auto md:hidden">
      <button type="button" aria-expanded={open} aria-controls="mobile-nav" onClick={() => setOpenFor(open ? null : pathname)} className="btn-outline !px-3">
        {open ? "Close" : "Menu"}
      </button>
      {open && (
        <nav id="mobile-nav" aria-label="Mobile" className="absolute right-0 top-full z-40 mt-2 flex w-60 flex-col rounded-lg border border-line bg-raised p-1.5 shadow-pop">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="rounded px-3 py-2.5 hover:bg-wash">{l.label}</Link>
          ))}
          {loggedIn ? (
            <form action={logout}><button className="w-full rounded-lg px-3 py-3 text-left hover:bg-wash">Log out</button></form>
          ) : (
            <Link href="/login" className="rounded px-3 py-2.5 hover:bg-wash">Log in</Link>
          )}
        </nav>
      )}
    </div>
  );
}
