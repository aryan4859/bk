import type { Metadata, Viewport } from "next";
import { Inter, Noto_Serif_Devanagari } from "next/font/google";
import Link from "next/link";
import { Assistant } from "@/components/Assistant";
import { BusinessValue } from "@/components/BusinessValue";
import { CompareBar } from "@/components/Compare";
import { CookieConsent, CookieSettingsButton } from "@/components/CookieConsent";
import { CurrentYear } from "@/components/CurrentYear";
import { HeadScript } from "@/components/HeadScript";
import { Logo } from "@/components/logo/Logo";
import { MobileMenu } from "@/components/MobileMenu";
import { Preloader } from "@/components/Preloader";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Toast } from "@/components/Toast";
import { logout } from "@/lib/actions";
import { assistantConfigured } from "@/lib/assistant/chat";
import { getUser } from "@/lib/auth";
import { BUSINESS, businessRows } from "@/lib/business";
import { readFlash } from "@/lib/flash";
import { preloadScript, themeScript } from "@/lib/head-scripts";
import { unreadThreadCount } from "@/lib/queries";
import "./globals.css";

// Inter for everything; the Devanagari face only for the assistant's Nepali name.
const sans = Inter({ variable: "--font-sans", subsets: ["latin"] });
const deva = Noto_Serif_Devanagari({ variable: "--font-devanagari", subsets: ["devanagari"], weight: ["500"], preload: false });

// browser chrome (address bar on phones) matches the page in each theme
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#1a1d22" },
  ],
};

export const metadata: Metadata = {
  title: { default: `${BUSINESS.siteName}: used bikes and scooters in Nepal`, template: `%s · ${BUSINESS.siteName}` },
  description: "Browse used motorcycles and scooters for sale across Nepal, filter by brand, city and price, and message sellers.",
};

async function Header() {
  const user = await getUser();
  const unread = user ? await unreadThreadCount(user.id) : 0;
  const navLink = "text-sm font-medium text-body transition-colors hover:text-accent";
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-raised">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:gap-7 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2" aria-label={`${BUSINESS.siteName} home`}>
          <Logo />
        </Link>
        <nav aria-label="Main" className="hidden items-center gap-6 md:flex">
          <Link href="/listings?type=MOTORCYCLE" className={navLink}>Motorcycles</Link>
          <Link href="/listings?type=SCOOTER" className={navLink}>Scooters</Link>
          <Link href="/compare" className={navLink}>Compare</Link>
          {user && <Link href="/saved" className={navLink}>Saved</Link>}
          {user && <Link href="/inbox" className={navLink}>Messages{unread > 0 && <span className="ml-1.5 rounded bg-accent px-1.5 py-0.5 text-[11px] font-medium text-on-accent">{unread}</span>}</Link>}
          {user?.role === "ADMIN" && <Link href="/admin" className={navLink}>Admin</Link>}
        </nav>
        <MobileMenu
          loggedIn={!!user}
          logout={logout}
          links={[
            { href: "/listings?type=MOTORCYCLE", label: "Motorcycles" },
            { href: "/listings?type=SCOOTER", label: "Scooters" },
            { href: "/compare", label: "Compare" },
            ...(user ? [{ href: "/saved", label: "Saved" }, { href: "/inbox", label: unread > 0 ? `Messages (${unread} unread)` : "Messages" }, { href: "/my", label: "My account" }] : []),
            ...(user?.role === "ADMIN" ? [{ href: "/admin", label: "Admin" }] : []),
          ]}
        />
        <div className="flex items-center gap-2 sm:gap-4 md:ml-auto">
          <ThemeToggle />
          <div className="hidden items-center gap-4 sm:flex">
            {user ? (
              <>
                <Link href="/my" className={navLink}>{user.name ?? user.email.split("@")[0]}</Link>
                <form action={logout}><button className={navLink}>Log out</button></form>
              </>
            ) : (
              <Link href="/login" className={navLink}>Log in</Link>
            )}
          </div>
          <Link href="/sell" className="btn-primary min-h-9 whitespace-nowrap px-3 sm:px-4"><span>Sell<span className="hidden sm:inline"> your bike</span></span></Link>
        </div>
      </div>
    </header>
  );
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const flashMsg = await readFlash();
  const footLink = "transition-colors hover:text-ink";
  return (
    <html lang="en" className={`${sans.variable} ${deva.variable} h-full`} suppressHydrationWarning>
      <head>
        <HeadScript code={themeScript + preloadScript} />
      </head>
      <body className="flex min-h-full flex-col">
        <a href="#main" className="skip-link">Skip to main content</a>
        <Preloader />
        <Header />
        {flashMsg && <Toast key={flashMsg.id} flash={flashMsg} />}
        <main id="main" tabIndex={-1} className="flex-1 outline-none">{children}</main>
        <footer className="mt-20 border-t border-line bg-raised text-sm text-muted">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:grid-cols-2 sm:px-6 lg:grid-cols-[1.6fr_1fr_1fr_1fr]">
            <div>
              <Link href="/" className="inline-flex" aria-label={`${BUSINESS.siteName} home`}><Logo size="sm" /></Link>
              <p className="mt-3 max-w-xs">Second-hand motorcycles and scooters, listed by their owners across Nepal. We don&apos;t sell or inspect bikes and aren&apos;t part of any deal.</p>
              {businessRows().length > 0 && (
                <ul className="mt-4 space-y-0.5">
                  {businessRows().map(([k, v]) => <li key={k}>{k}: <BusinessValue label={k} value={v} className="text-ink hover:underline" /></li>)}
                </ul>
              )}
            </div>
            <nav aria-label="Buy" className="flex flex-col items-start gap-2">
              <h2 className="mb-1 text-sm font-semibold text-ink">Buy</h2>
              <Link href="/listings?type=MOTORCYCLE" className={footLink}>Motorcycles</Link>
              <Link href="/listings?type=SCOOTER" className={footLink}>Scooters</Link>
              <Link href="/listings?budget=under-1l" className={footLink}>Under Rs 1 lakh</Link>
              <Link href="/compare" className={footLink}>Compare bikes</Link>
            </nav>
            <nav aria-label="Sell" className="flex flex-col items-start gap-2">
              <h2 className="mb-1 text-sm font-semibold text-ink">Sell</h2>
              <Link href="/sell" className={footLink}>Post an ad</Link>
              <Link href="/my" className={footLink}>My ads</Link>
              <Link href="/contact" className={footLink}>Contact us</Link>
            </nav>
            <nav aria-label="Legal" className="flex flex-col items-start gap-2">
              <h2 className="mb-1 text-sm font-semibold text-ink">Policies</h2>
              <Link href="/privacy" className={footLink}>Privacy</Link>
              <Link href="/terms" className={footLink}>Terms</Link>
              <Link href="/refunds" className={footLink}>Refunds</Link>
              <Link href="/cookies" className={footLink}>Cookies</Link>
              <CookieSettingsButton className={footLink}>Cookie settings</CookieSettingsButton>
            </nav>
          </div>
          <div className="border-t border-line">
            <div className="mx-auto flex max-w-6xl flex-wrap justify-between gap-2 px-4 py-4 text-xs sm:px-6">
              <p>© <CurrentYear /> {BUSINESS.siteName}</p>
              <p>Meet in a public place, check the bluebook, never pay in advance.</p>
            </div>
          </div>
        </footer>
        <CompareBar />
        {assistantConfigured() && <Assistant />}
        <CookieConsent />
      </body>
    </html>
  );
}
