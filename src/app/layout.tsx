import type { Metadata } from "next";
import { Geist } from "next/font/google";
import Link from "next/link";
import { getUser } from "@/lib/auth";
import { logout } from "@/lib/actions";
import "./globals.css";

const geist = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "test — second-hand bikes and scooters in Nepal", template: "%s · test" },
  description: "Buy and sell used motorcycles and scooters directly with owners across Nepal.",
};

async function Header() {
  const user = await getUser();
  return (
    <header className="border-b border-line bg-card">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4">
        <Link href="/" className="text-2xl font-bold tracking-tight text-brand">
          test
        </Link>
        <nav className="hidden items-center gap-5 text-[15px] text-muted sm:flex">
          <Link href="/listings" className="hover:text-ink">Browse</Link>
          {user && <Link href="/saved" className="hover:text-ink">Saved</Link>}
          {user && <Link href="/inbox" className="hover:text-ink">Messages</Link>}
          {user?.role === "ADMIN" && <Link href="/admin" className="hover:text-ink">Admin</Link>}
        </nav>
        <div className="ml-auto flex items-center gap-3">
          {user ? (
            <>
              <Link href="/my" className="hidden text-[15px] text-muted hover:text-ink sm:block">
                {user.name ?? user.email.split("@")[0]}
              </Link>
              <form action={logout}>
                <button className="text-[15px] text-muted hover:text-ink">Log out</button>
              </form>
            </>
          ) : (
            <Link href="/login" className="text-[15px] text-muted hover:text-ink">Log in</Link>
          )}
          <Link href="/sell" className="btn-primary">Sell a bike</Link>
        </div>
      </div>
    </header>
  );
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geist.variable} h-full`}>
      <body className="flex min-h-full flex-col">
        <Header />
        <div className="flex-1">{children}</div>
        <footer className="mt-16 border-t border-line">
          <div className="mx-auto flex max-w-6xl flex-wrap gap-x-8 gap-y-2 px-4 py-6 text-sm text-muted">
            <span>© {new Date().getFullYear()} test</span>
            <span>Meet in a public place, check the bluebook and never pay in advance.</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
