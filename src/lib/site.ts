import { BUSINESS } from "./business";

/** Public address of the site without a trailing slash, from SITE_URL. Used for canonical URLs, the sitemap and email links. */
export const siteUrl = () => (process.env.SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

/** A path (or an already absolute URL, such as an R2 photo) as a full URL on this site. */
export const absoluteUrl = (path: string) => new URL(path, `${siteUrl()}/`).toString();

/** Who runs the site, for structured data. Empty business fields are left out rather than invented. */
export const organizationLd = () => ({
  "@type": "Organization",
  "@id": `${siteUrl()}/#organization`,
  name: BUSINESS.siteName,
  url: siteUrl(),
  logo: absoluteUrl("/icon.svg"),
  ...(BUSINESS.legalName && { legalName: BUSINESS.legalName }),
  ...(BUSINESS.email && { email: BUSINESS.email }),
  ...(BUSINESS.phone && { telephone: BUSINESS.phone }),
  areaServed: { "@type": "Country", name: BUSINESS.country },
});
