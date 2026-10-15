import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Inter, Noto_Serif_Devanagari } from "next/font/google";
import Link from "next/link";
import { BusinessValue } from "@/components/BusinessValue";
import { CompareBar } from "@/components/Compare";
import { CookieConsent, CookieSettingsButton } from "@/components/CookieConsent";
import { CurrentYear } from "@/components/CurrentYear";
import { MobileMenu } from "@/components/MobileMenu";
import { Reveal } from "@/components/Reveal";
import { ThemeToggle, themeScript } from "@/components/ThemeToggle";
import { Toast } from "@/components/Toast";
import { logout } from "@/lib/actions";
import { getUser } from "@/lib/auth";
import { BUSINESS, businessRows } from "@/lib/business";
import { readFlash } from "@/lib/flash";
import { unreadThreadCount } from "@/lib/queries";
import "./globals.css";

// DESIGN.md substitutes: Cormorant Garamond for the serif display, Inter for text.
const serif = Cormorant_Garamond({ variable: "--font-serif", subsets: ["latin"], weight: ["500"] });
const sans = Inter({ variable: "--font-sans", subsets: ["latin"] });
const deva = Noto_Serif_Devanagari({ variable: "--font-devanagari", subsets: ["devanagari"], weight: ["500"], preload: false });

// browser chrome (address bar on phones) matches the page in each theme
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#faf9f5" }, // taste-skill-ignore: DESIGN.md canvas
    { media: "(prefers-color-scheme: dark)", color: "#181715" },
  ],
};

export const metadata: Metadata = {
  title: { default: `${BUSINESS.siteName}: used bikes and scooters in Nepal`, template: `%s · ${BUSINESS.siteName}` },
  description: "Browse used motorcycles and scooters for sale across Nepal, filter by brand, city and price, and message sellers.",
};

async function Header() {
  const user = await getUser();
  const unread = user ? await unreadThreadCount(user.id) : 0;
  const navLink = "text-sm font-medium text-ink underline-offset-4 hover:underline";
  return (
    <header className="sticky top-0 z-30 bg-canvas">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:gap-8 sm:px-6">
        <Link href="/" className="flex items-baseline gap-2" aria-label={`${BUSINESS.siteName} home`}>
          <span className="font-display text-[28px] leading-none text-ink">{BUSINESS.siteName}</span>
          <span className="font-deva text-sm text-muted" aria-hidden>सवारी</span>
        </Link>
        <nav aria-label="Main" className="hidden items-center gap-6 sm:flex">
          <Link href="/listings" className={navLink}>Browse</Link>
          {user && <Link href="/saved" className={navLink}>Saved</Link>}
          {user && <Link href="/inbox" className={navLink}>Messages{unread > 0 && <span className="ml-1.5 rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-on-accent">{unread}</span>}</Link>}
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
        <div className="flex items-center gap-2 sm:ml-auto sm:gap-4">
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
          <Link href="/sell" className="btn-primary whitespace-nowrap px-3 sm:px-5"><span>Sell<span className="hidden sm:inline"> a bike</span></span></Link>
        </div>
      </div>
    </header>
  );
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const flashMsg = await readFlash();
  const footLink = "text-on-dark-soft underline-offset-4 hover:text-on-dark hover:underline";
  return (
    <html lang="en" className={`${serif.variable} ${sans.variable} ${deva.variable} h-full`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="flex min-h-full flex-col">
        <a href="#main" className="skip-link">Skip to main content</a>
        <Header />
        {flashMsg && <Toast key={flashMsg.id} flash={flashMsg} />}
        <main id="main" tabIndex={-1} className="flex-1 outline-none">{children}</main>
        <footer className="mt-24 bg-dark text-on-dark-soft">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 pb-10 pt-16 sm:grid-cols-[1.4fr_1fr_1fr] sm:px-6">
            <div>
              <p className="max-w-sm text-on-dark">A noticeboard for second-hand bikes and scooters in Nepal. We don&apos;t sell or inspect bikes, and we aren&apos;t part of any deal.</p>
              <p className="mt-4 max-w-sm text-sm">Meet in a public place, check the bluebook and never pay in advance.</p>
              {businessRows().length > 0 && (
                <ul className="mt-4 space-y-0.5 text-sm">
                  {businessRows().map(([k, v]) => <li key={k}>{k}: <BusinessValue label={k} value={v} className="text-on-dark underline underline-offset-4" /></li>)}
                </ul>
              )}
            </div>
            <nav aria-label="Explore" className="flex flex-col items-start gap-2.5 text-sm">
              <Link href="/listings" className={footLink}>Browse bikes</Link>
              <Link href="/sell" className={footLink}>Sell a bike</Link>
              <Link href="/contact" className={footLink}>Contact and business details</Link>
            </nav>
            <nav aria-label="Legal" className="flex flex-col items-start gap-2.5 text-sm">
              <Link href="/privacy" className={footLink}>Privacy policy</Link>
              <Link href="/terms" className={footLink}>Terms and conditions</Link>
              <Link href="/refunds" className={footLink}>Refund policy</Link>
              <Link href="/cookies" className={footLink}>Cookie policy</Link>
              <CookieSettingsButton className={footLink}>Cookie settings</CookieSettingsButton>
            </nav>
          </div>
          {/* the name returns at full width to close the page */}
          <div className="mx-auto flex max-w-6xl items-end justify-between gap-4 overflow-hidden px-4 pb-6 sm:px-6">
            <p aria-hidden className="font-display text-[26vw] leading-[0.8] tracking-[-0.04em] text-on-dark lg:text-[17rem]">{BUSINESS.siteName}</p>
            <p className="shrink-0 pb-2 text-xs">© <CurrentYear /> {BUSINESS.siteName}</p>
          </div>
        </footer>
        <Reveal />
        <CompareBar />
        <CookieConsent />
      </body>
    </html>
  );
}
