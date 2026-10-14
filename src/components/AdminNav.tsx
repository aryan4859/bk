"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  ["/admin", "Dashboard"],
  ["/admin/listings", "Listings"],
  ["/admin/users", "Users"],
  ["/admin/reports", "Reports"],
] as const;

export function AdminNav({ pending, reports }: { pending: number; reports: number }) {
  const path = usePathname();
  const badge = (href: string) => (href === "/admin/listings" ? pending : href === "/admin/reports" ? reports : 0);
  return (
    <nav className="flex gap-1 overflow-x-auto md:flex-col">
      {ITEMS.map(([href, label]) => {
        const active = href === "/admin" ? path === href : path.startsWith(href);
        const n = badge(href);
        return (
          <Link key={href} href={href} className={`flex items-center justify-between gap-3 whitespace-nowrap rounded-md px-3 py-2 text-[15px] ${active ? "bg-ink text-white" : "text-muted hover:bg-surface-sunk hover:text-ink"}`}>
            {label}
            {n > 0 && <span className={`rounded-full px-2 text-xs ${active ? "bg-white/20" : "bg-accent text-ink"}`}>{n}</span>}
          </Link>
        );
      })}
    </nav>
  );
}
