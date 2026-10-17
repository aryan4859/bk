"use client";

/**
 * An inline script that runs from the server HTML before first paint (theme, intro). React 19 warns about any
 * <script> it renders on the client, so on the client the tag becomes inert text/plain; the HTML the browser
 * already ran is untouched, and suppressHydrationWarning covers the changed type.
 */
export function HeadScript({ code }: { code: string }) {
  return <script type={typeof window === "undefined" ? undefined : "text/plain"} suppressHydrationWarning dangerouslySetInnerHTML={{ __html: code }} />;
}
