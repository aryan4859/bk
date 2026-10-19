import type { MetadataRoute } from "next";
import { connection } from "next/server";
import { siteUrl } from "@/lib/site";

// Pages that only make sense signed in, or that are copies of other pages, are kept out of search results.
export default async function robots(): Promise<MetadataRoute.Robots> {
  await connection(); // read SITE_URL when served, not when built
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api/", "/inbox", "/my", "/saved", "/sell", "/login", "/compare", "/listings/*/edit"],
    },
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
