import { PageHero } from "./PageHero";
import { BUSINESS, LEGAL_UPDATED } from "@/lib/business";

export function LegalPage({ title, intro, children }: { title: string; intro?: string; children: React.ReactNode }) {
  return (
    <>
      <PageHero title={title} subtitle={intro} />
      <article className="mx-auto max-w-3xl px-6 py-12 leading-[1.7] [&_a]:text-brand [&_a]:underline [&_h2]:font-display [&_h2]:mt-10 [&_h2]:text-2xl [&_li]:mt-1.5 [&_p]:mt-3 [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-6">
        <p className="!mt-0 text-sm text-muted">Last updated {LEGAL_UPDATED}. These pages describe how {BUSINESS.siteName} works today and are a starting point, not legal advice.</p>
        {children}
      </article>
    </>
  );
}

export function Contact() {
  return BUSINESS.email
    ? <a href={`mailto:${BUSINESS.email}`}>{BUSINESS.email}</a>
    : <>the contact details on our <a href="/contact">contact page</a></>;
}
