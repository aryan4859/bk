export function formatNpr(n: number) {
  return "Rs. " + new Intl.NumberFormat("en-IN").format(n);
}

export function formatKm(n: number) {
  return new Intl.NumberFormat("en-IN").format(n) + " km";
}

export function timeAgo(d: Date) {
  const s = Math.max(1, Math.floor((Date.now() - d.getTime()) / 1000));
  const units: [number, string][] = [[31536000, "year"], [2592000, "month"], [86400, "day"], [3600, "hour"], [60, "minute"]];
  for (const [secs, name] of units) {
    if (s >= secs) {
      const n = Math.floor(s / secs);
      return `${n} ${name}${n > 1 ? "s" : ""} ago`;
    }
  }
  return "just now";
}

export function normalizePhone(raw: string) {
  const d = raw.replace(/\D/g, "");
  if (d.startsWith("977")) return d;
  return d.length === 10 ? "977" + d : d;
}

export const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000);

/** True while a boost is still running. */
export const isFeaturedNow = (until?: Date | null) => !!until && until.getTime() > Date.now();
