import type { Metadata } from "next";
import { BusinessValue } from "@/components/BusinessValue";
import { PageHero } from "@/components/PageHero";
import { BUSINESS, businessRows } from "@/lib/business";

export const metadata: Metadata = { title: "Contact and business details", description: `Who runs ${BUSINESS.siteName} and how to contact us.`, alternates: { canonical: "/contact" } };

export default function ContactPage() {
  const rows = businessRows();
  return (
    <>
      <PageHero title="Contact us" subtitle={`Who runs ${BUSINESS.siteName} and how to reach us.`} />
      <div className="mx-auto max-w-2xl px-6 py-12">
        {rows.length === 0 ? (
          <p className="rounded-lg bg-surface p-8 text-center text-muted">Contact details are being added. Please check back soon.</p>
        ) : (
          <dl className="space-y-2">
            {rows.map(([k, v]) => (
              <div key={k} className="grid gap-1 rounded-lg bg-surface p-4 sm:grid-cols-[180px_1fr]">
                <dt className="text-sm text-muted">{k}</dt>
                <dd className="font-medium"><BusinessValue label={k} value={v} className="link" /></dd>
              </div>
            ))}
          </dl>
        )}
        <p className="mt-6 text-sm text-muted">To report an ad, use the &quot;Report this ad&quot; link on the ad itself so we can see which one you mean.</p>
      </div>
    </>
  );
}
