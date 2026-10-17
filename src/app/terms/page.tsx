import type { Metadata } from "next";
import { Contact, LegalPage } from "@/components/LegalPage";
import { BUSINESS } from "@/lib/business";

export const metadata: Metadata = { title: "Terms and conditions", description: "The rules for buying, selling and using the site." };

export default function Terms() {
  return (
    <LegalPage title="Terms and conditions" intro="The rules for using the site, as a buyer or a seller.">
      <h2>What {BUSINESS.siteName} is</h2>
      <p>{BUSINESS.siteName} is a place for people to advertise and find used motorcycles and scooters. We are not a party to any sale. Buyers and sellers agree the price, inspection, paperwork and payment between themselves.</p>

      <h2>Your account</h2>
      <ul>
        <li>You must be 18 or over and give a real email address you control.</li>
        <li>You are responsible for what happens under your account.</li>
        <li>We may suspend or remove accounts that break these terms.</li>
      </ul>

      <h2>Posting an ad</h2>
      <ul>
        <li>You must own the bike or be allowed to sell it, and the details and photos must be accurate and your own.</li>
        <li>Do not post stolen vehicles, vehicles without valid ownership papers, duplicate or misleading ads, or anything illegal.</li>
        <li>Do not use the site for spam, harassment or to move people off the site to scam them.</li>
        <li>Ads are checked by our team before they appear, and we may reject, edit or remove any ad. A check is not a guarantee that an ad is accurate or that a bike is genuine.</li>
      </ul>

      <h2>Buying safely</h2>
      <p>Meet in a public place, inspect the bike, check the bluebook and the owner&apos;s identity, and never pay in advance. Information such as &quot;bluebook up to date&quot; is stated by the seller and is not verified by us.</p>

      <h2>Reviews and ratings</h2>
      <p>Buyers who have messaged a seller on {BUSINESS.siteName} can rate that seller from 1 to 5 stars and leave a comment. Reviews come only from real users; we do not publish, buy or ask for fake reviews, and you must not post or request them either. We may remove reviews that are fake, abusive or unrelated to a deal.</p>

      <h2>The assistant</h2>
      <p>&quot;Ask Seto Durbar&quot; is an automated assistant. It searches the ads on the site and explains how the site works, but its answers can be wrong or out of date. Always check the ad itself, and never treat its answers as advice about whether a deal is safe.</p>

      <h2>Content you post</h2>
      <p>You keep ownership of your content, and you give us permission to display it on the site so we can run the service. You are responsible for it.</p>

      <h2>Our responsibility</h2>
      <p>We provide the site as it is. To the extent the law allows, we are not responsible for the condition, legality or price of any bike, for what other users do, or for losses from deals made through the site. Nothing in these terms limits any right you have under law that cannot be limited.</p>

      <h2>Reporting problems</h2>
      <p>Use the &quot;Report this ad&quot; link on an ad, or contact <Contact />.</p>

      <h2>Changes and law</h2>
      <p>We may update these terms and will change the date above when we do. These terms are governed by the laws of {BUSINESS.country}.</p>
    </LegalPage>
  );
}
