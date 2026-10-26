"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/Icon";

// Phone-only tab bar fixed to the bottom of the screen; its height is --tab-bar in globals.css.
export function BottomNav({ loggedIn }: { loggedIn: boolean }) {
  const pathname = usePathname();
  const profile = loggedIn ? "/my" : "/login";
  const tabs = [
    { href: "/", label: "Home", icon: "home", active: pathname === "/" },
    { href: "/listings", label: "Search", icon: "search", active: pathname.startsWith("/listings") },
    null, // the raised Sell button sits in the middle
    { href: "/saved", label: "Liked", icon: "heart", active: pathname.startsWith("/saved") },
    { href: profile, label: "Profile", icon: "user", active: pathname.startsWith("/my") || pathname.startsWith("/login") },
  ] as const;
  const sellActive = pathname.startsWith("/sell");

  return (
    <nav aria-label="Tabs" className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-raised pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_16px_-8px_rgb(16_24_40/0.18)] md:hidden">
      <ul className="mx-auto grid h-16 max-w-md grid-cols-5">
        {tabs.map((t) =>
          t ? (
            <li key={t.label}>
              <Link
                href={t.href}
                aria-current={t.active ? "page" : undefined}
                className={`flex h-full flex-col items-center justify-center gap-1 text-[11px] font-semibold uppercase tracking-wide transition-colors ${t.active ? "text-brand" : "text-muted hover:text-ink"}`}
              >
                <Icon name={t.icon} className="size-6" />
                {t.label}
              </Link>
            </li>
          ) : (
            <li key="sell">
              <Link
                href="/sell"
                aria-current={sellActive ? "page" : undefined}
                className={`relative flex h-full flex-col items-center justify-end gap-1 pb-2.5 text-[11px] font-semibold uppercase tracking-wide ${sellActive ? "text-brand" : "text-muted hover:text-ink"}`}
              >
                <span className="absolute -top-6 left-1/2 inline-flex -translate-x-1/2 size-14 items-center justify-center rounded-full bg-brand text-on-dark shadow-pop ring-4 ring-raised transition-transform duration-150 active:scale-95">
                  <Icon name="plus" className="size-7" />
                </span>
                Sell
              </Link>
            </li>
          ),
        )}
      </ul>
    </nav>
  );
}
