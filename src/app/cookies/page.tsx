import type { Metadata } from "next";
import { CookieSettingsButton } from "@/components/CookieConsent";
import { Contact, LegalPage } from "@/components/LegalPage";
import { BUSINESS } from "@/lib/business";

export const metadata: Metadata = { title: "Cookie policy", description: "The cookies this site sets and what each one is for." };

export default function Cookies() {
  return (
    <LegalPage title="Cookie policy" intro="Which cookies we set, and what each one is for.">
      <h2>What we use</h2>
      <div className="mt-4 overflow-x-auto rounded-lg bg-surface">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">Cookies set by {BUSINESS.siteName}</caption>
          <thead className="bg-surface-sunk"><tr><th scope="col" className="p-3">Name</th><th scope="col" className="p-3">Purpose</th><th scope="col" className="p-3">Type</th><th scope="col" className="p-3">Lasts</th></tr></thead>
          <tbody className="[&>tr:nth-child(even)]:bg-wash">
            <tr><td className="p-3 font-medium text-ink">session</td><td className="p-3">Keeps you logged in after you enter your emailed code.</td><td className="p-3">Essential</td><td className="p-3">30 days</td></tr>
            <tr><td className="p-3 font-medium text-ink">flash</td><td className="p-3">Carries a one-time confirmation or error message (such as &quot;Ad deleted&quot;) to the next page.</td><td className="p-3">Essential</td><td className="p-3">Up to 1 minute</td></tr>
            <tr><td className="p-3 font-medium text-ink">consent</td><td className="p-3">Remembers the choice you made in the cookie banner.</td><td className="p-3">Essential</td><td className="p-3">6 months</td></tr>
            <tr><td className="p-3 font-medium text-ink">theme</td><td className="p-3">Remembers light or dark mode if you choose one with the switch in the header. Stored in your browser (local storage), never sent to us.</td><td className="p-3">Functional, set only when you use the switch</td><td className="p-3">Until you switch back or clear site data</td></tr>
            <tr><td className="p-3 font-medium text-ink">compare</td><td className="p-3">The bikes you picked to compare. Stored in your browser (local storage), never sent to us.</td><td className="p-3">Functional, set only when you use Compare</td><td className="p-3">Until you clear the selection or site data</td></tr>
          </tbody>
        </table>
      </div>
      <p>Essential cookies are needed for the site to work, so they are not switched off by the banner. We do not currently set analytics, advertising or social-media cookies, and we load fonts from our own server rather than a third party.</p>

      <h2>If this changes</h2>
      <p>If we add anything optional, such as analytics or an embedded map or video, it will stay off until you accept it in the cookie banner, and this page will be updated.</p>

      <h2>Your choice</h2>
      <p>You can change your choice at any time:</p>
      <p><CookieSettingsButton /></p>
      <p>You can also block or delete cookies in your browser settings, but you will not be able to log in without the session cookie. More about how we handle data is in the <a href="/privacy">privacy policy</a>. Questions: <Contact />.</p>
    </LegalPage>
  );
}
