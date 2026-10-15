import type { Metadata } from "next";
import { Contact, LegalPage } from "@/components/LegalPage";
import { BUSINESS } from "@/lib/business";

export const metadata: Metadata = { title: "Privacy policy", description: "What personal information we collect, why we collect it, and your choices." };

export default function Privacy() {
  return (
    <LegalPage title="Privacy policy" intro="What we collect, why, and the choices you have.">
      <h2>Who we are</h2>
      <p>{BUSINESS.siteName} is an online noticeboard where people in {BUSINESS.country} list and find used motorcycles and scooters. Questions about this policy go to <Contact />.</p>

      <h2>What we collect</h2>
      <ul>
        <li><b>Account:</b> your email address, and a display name if you add one.</li>
        <li><b>Listings:</b> the bike details, description, city, asking price, mobile number and photos you upload.</li>
        <li><b>Messages and reports:</b> messages you send to other users, and reports you file about an ad.</li>
        <li><b>Saved bikes and alerts:</b> the ads you save (with their price at the time, so we can tell you if it drops) and the searches you ask us to email you about.</li>
        <li><b>Reviews:</b> the star rating and comment you leave for a seller you have messaged.</li>
        <li><b>Assistant chats:</b> what you type into &quot;Ask Sawari&quot;. We do not store these chats on our servers; your browser keeps them for the visit.</li>
        <li><b>Login codes:</b> the 6-digit code we email you is stored only as a hash and expires after 10 minutes.</li>
        <li><b>Technical data:</b> your IP address, used to limit abuse (for example too many login attempts), and a session cookie that keeps you logged in.</li>
      </ul>
      <p>We do not run advertising or analytics trackers, and we do not collect payment details.</p>

      <h2>What other people can see</h2>
      <ul>
        <li>An active ad is public: photos, details, city and price.</li>
        <li>Your mobile number on an ad is shown only to logged-in users.</li>
        <li>Reviews you leave are public on the seller&apos;s profile, with your display name.</li>
        <li>Sellers are shown by display name. If you have not set one, the first part of your email address (before the @) is shown instead, so set a display name if you prefer.</li>
      </ul>

      <h2>Why we use it</h2>
      <ul>
        <li>To run your account, publish your ads and pass messages between buyers and sellers.</li>
        <li>To review ads and handle reports, and to keep the site safe from spam and fraud.</li>
        <li>To email you login codes, and the price-drop and new-match alerts you turned on. We do not send marketing email.</li>
        <li>To answer questions in &quot;Ask Sawari&quot;.</li>
      </ul>

      <h2>Who we share it with</h2>
      <p>We use service providers to run the site: Google (to send emails), Cloudflare (to store and serve photos), our hosting and database provider, and, for &quot;Ask Sawari&quot;, OpenRouter and the AI model provider it routes to (Anthropic), which receive the messages you type there to generate an answer. Do not type personal details such as phone numbers into the assistant. They process data on our instructions. We may disclose information if the law requires it, or to protect users from fraud or harm. We do not sell personal data.</p>

      <h2>How long we keep it</h2>
      <p>We keep your account and ads until you ask us to delete them. Deleting an ad removes it from the site. Messages, reports and security logs may be kept for a reasonable period afterwards to deal with disputes and abuse.</p>

      <h2>Your choices</h2>
      <p>You can edit or delete your ads and change your display name from <a href="/my">My account</a>. You can also ask us to give you a copy of your data, correct it, or delete your account by contacting <Contact />. We follow the data-protection rules that apply in {BUSINESS.country}, including the Privacy Act, 2075 (2018).</p>

      <h2>Security</h2>
      <p>Sessions use a protected, HTTP-only cookie and the site is served over HTTPS in production. No system is perfectly secure, so please report anything suspicious to us.</p>

      <h2>Children</h2>
      <p>{BUSINESS.siteName} is not meant for people under 18, and we do not knowingly collect their data.</p>

      <h2>Changes</h2>
      <p>If we change this policy in a meaningful way we will update the date above and, where appropriate, tell you on the site.</p>
    </LegalPage>
  );
}
