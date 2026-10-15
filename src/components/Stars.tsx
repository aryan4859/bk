import { formatRating } from "@/lib/reviews";

const STAR = "M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8L3.5 9.7l5.9-.9z";

/** Read-only star rating with an accessible text label. */
export function Stars({ avg, count, className = "" }: { avg: number; count?: number; className?: string }) {
  const filled = Math.round(avg);
  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`} aria-label={`Rated ${formatRating(avg)} out of 5${count !== undefined ? ` from ${count} ${count === 1 ? "review" : "reviews"}` : ""}`}>
      <span aria-hidden className="flex">
        {[0, 1, 2, 3, 4].map((i) => (
          <svg key={i} viewBox="0 0 24 24" className={`size-[1em] ${i < filled ? "fill-star" : "fill-cream"}`}><path d={STAR} /></svg>
        ))}
      </span>
      <span aria-hidden className="text-muted">{formatRating(avg)}{count !== undefined && ` (${count})`}</span>
    </span>
  );
}
