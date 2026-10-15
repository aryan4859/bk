import type { Metadata } from "next";
import { Archivo, Noto_Sans_Devanagari, Public_Sans } from "next/font/google";
import Link from "next/link";
import { BusinessValue } from "@/components/BusinessValue";
import { CompareBar } from "@/components/Compare";
import { CookieConsent, CookieSettingsButton } from "@/components/CookieConsent";
import { CurrentYear } from "@/components/CurrentYear";
import { MobileMenu } from "@/components/MobileMenu";
import { Toast } from "@/components/Toast";
import { logout } from "@/lib/actions";
import { getUser } from "@/lib/auth";
import { BUSINESS, businessRows } from "@/lib/business";
import { readFlash } from "@/lib/flash";
import { unreadThreadCount } from "@/lib/queries";
import "./globals.css";

const archivo = Archivo({ variable: "--font-archivo", subsets: ["latin"], axes: ["wdth"] });
const publicSans = Public_Sans({ variable: "--font-public", subsets: ["latin"] });
const deva = Noto_Sans_Devanagari({ variable: "--font-deva", subsets: ["devanagari"], weight: ["600"], preload: false });

export const metadata: Metadata = {
  title: { default: `${BUSINESS.siteName}: used bikes and scooters in Nepal`, template: `%s · ${BUSINESS.siteName}` },
  description: "Browse used motorcycles and scooters for sale across Nepal, filter by brand, city and price, and message sellers.",
};

async function Header() {
  const user = await getUser();
  const unread = user ? await unreadThreadCount(user.id) : 0;
  const navLink = "underline-offset-4 hover:underline";
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-white">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:gap-8 sm:px-6">
        <Link href="/" className="flex items-baseline gap-2" aria-label={`${BUSINESS.siteName} home`}>
          <span className="font-display text-2xl">{BUSINESS.siteName}</span>
          <span className="font-[family-name:var(--font-deva)] text-sm font-semibold text-muted" aria-hidden>सवारी</span>
        </Link>
        <nav aria-label="Main" className="hidden items-center gap-6 text-[15px] sm:flex">
          <Link href="/listings" className={navLink}>Browse</Link>
          {user && <Link href="/saved" className={navLink}>Saved</Link>}
          {user && <Link href="/inbox" className={navLink}>Messages{unread > 0 && <span className="ml-1.5 rounded-sm bg-accent px-1.5 py-0.5 text-xs font-semibold text-ink">{unread}</span>}</Link>}
          {user?.role === "ADMIN" && <Link href="/admin" className={navLink}>Admin</Link>}
        </nav>
        <MobileMenu
          loggedIn={!!user}
          logout={logout}
          links={[
            { href: "/listings", label: "Browse" },
            ...(user ? [{ href: "/saved", label: "Saved" }, { href: "/inbox", label: unread > 0 ? `Messages (${unread} unread)` : "Messages" }, { href: "/my", label: "My account" }] : []),
            ...(user?.role === "ADMIN" ? [{ href: "/admin", label: "Admin" }] : []),
          ]}
        />
        <div className="flex items-center gap-4 sm:ml-auto">
          <div className="hidden items-center gap-4 text-[15px] sm:flex">
            {user ? (
              <>
                <Link href="/my" className={navLink}>{user.name ?? user.email.split("@")[0]}</Link>
                <form action={logout}><button className={navLink}>Log out</button></form>
              </>
            ) : (
              <Link href="/login" className={navLink}>Log in</Link>
            )}
          </div>
          <Link href="/sell" className="btn-primary whitespace-nowrap px-3 sm:px-5">Sell<span className="hidden sm:inline">&nbsp;a bike</span></Link>
        </div>
      </div>
    </header>
  );
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const flashMsg = await readFlash();
  const footLink = "underline-offset-4 hover:underline";
  return (
    <html lang="en" className={`${archivo.variable} ${publicSans.variable} ${deva.variable} h-full`}>
      <body className="flex min-h-full flex-col">
        <a href="#main" className="skip-link">Skip to main content</a>
        <Header />
        {flashMsg && <Toast key={flashMsg.id} flash={flashMsg} />}
        <main id="main" tabIndex={-1} className="flex-1 outline-none">{children}</main>
        <footer className="mt-24 border-t border-line bg-wash">
          <div className="mx-auto grid max-w-6xl gap-10 px-6 py-12 sm:grid-cols-3">
            <div>
              <div className="font-display text-2xl">{BUSINESS.siteName}</div>
              <p className="mt-2 max-w-xs text-sm text-muted">A noticeboard for second-hand bikes and scooters in Nepal. We don&apos;t sell or inspect bikes, and we aren&apos;t part of any deal.</p>
              {businessRows().length > 0 && (
                <ul className="mt-3 space-y-0.5 text-sm">
                  {businessRows().map(([k, v]) => <li key={k}>{k}: <BusinessValue label={k} value={v} className="underline underline-offset-4" /></li>)}
                </ul>
              )}
            </div>
            <nav aria-label="Explore" className="flex flex-col gap-2 text-sm">
              <Link href="/listings" className={footLink}>Browse bikes</Link>
              <Link href="/sell" className={footLink}>Sell a bike</Link>
              <Link href="/contact" className={footLink}>Contact and business details</Link>
            </nav>
            <nav aria-label="Legal" className="flex flex-col items-start gap-2 text-sm">
              <Link href="/privacy" className={footLink}>Privacy policy</Link>
              <Link href="/terms" className={footLink}>Terms and conditions</Link>
              <Link href="/refunds" className={footLink}>Refund policy</Link>
              <Link href="/cookies" className={footLink}>Cookie policy</Link>
              <CookieSettingsButton className={footLink}>Cookie settings</CookieSettingsButton>
            </nav>
          </div>
          <p className="mx-auto max-w-6xl px-6 pb-6 text-sm text-muted">Meet in a public place, check the bluebook and never pay in advance.</p>
          <div className="border-t border-line py-4 text-center text-xs text-muted">© <CurrentYear /> {BUSINESS.siteName}</div>
        </footer>
        <CompareBar />
        <CookieConsent />
      </body>
    </html>
  );
}
