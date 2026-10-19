import type { Metadata } from "next";
import { Contact, LegalPage } from "@/components/LegalPage";
import { BUSINESS } from "@/lib/business";

export const metadata: Metadata = { title: "Refund policy", description: "What is and is not refundable when using the site.", alternates: { canonical: "/refunds" } };

export default function Refunds() {
  return (
    <LegalPage title="Refund policy" intro="Plainly: what is and isn't refundable.">
      <h2>Using {BUSINESS.siteName} is free</h2>
      <p>At the moment we do not charge for browsing, posting ads or messaging, so there is nothing to refund.</p>

      <h2>Money paid for a bike</h2>
      <p>We do not take, hold or handle payments between buyers and sellers. A purchase is a private deal between the two of you, so we cannot refund, reverse or guarantee it. Refunds, returns and any warranty are for you and the seller to agree before you pay. Never pay in advance, and keep a written record of what was agreed.</p>

      <h2>If something goes wrong</h2>
      <ul>
        <li>Use &quot;Report this ad&quot; to tell us about fake, stolen or misleading ads. We will review it and may remove the ad or the account.</li>
        <li>If you think a crime has taken place, report it to the police. We will help with lawful requests.</li>
      </ul>

      <h2>If we introduce paid features</h2>
      <p>If we ever charge for something (for example promoting an ad), we will show the price and the refund rules before you pay, and update this page first.</p>

      <p>Questions: <Contact />.</p>
    </LegalPage>
  );
}
