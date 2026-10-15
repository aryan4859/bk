import { formatRating, stars } from "@/lib/reviews";

/** Read-only star rating with an accessible text label. */
export function Stars({ avg, count, className = "" }: { avg: number; count?: number; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 ${className}`} aria-label={`Rated ${formatRating(avg)} out of 5${count !== undefined ? ` from ${count} ${count === 1 ? "review" : "reviews"}` : ""}`}>
      <span aria-hidden className="tracking-tight text-accent-dark">{stars(avg)}</span>
      <span aria-hidden className="text-muted">{formatRating(avg)}{count !== undefined && ` (${count})`}</span>
    </span>
  );
}
