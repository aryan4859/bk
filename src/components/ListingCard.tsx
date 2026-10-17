import Link from "next/link";
import { formatKm, formatNpr, isFeaturedNow } from "@/lib/format";
import type { Rating } from "@/lib/queries";
import { CompareToggle } from "./Compare";
import { Photo } from "./Photo";
import { Stars } from "./Stars";
import { Chip } from "./ui/Chip";

type Props = {
  listing: {
    id: string; title: string; priceNpr: number; year: number; kmDriven: number;
    city: string; brand: string; model: string; negotiable: boolean;
    status: string; images: { url: string }[];
    featuredUntil?: Date | null; rating?: Rating | null;
  };
  /** show the "+ Compare" button (only for live ads) */
  compare?: boolean;
  /** preload the photo (use for the first row, which is above the fold) */
  priority?: boolean;
};

export function ListingCard({ listing: l, compare = false, priority = false }: Props) {
  const featured = isFeaturedNow(l.featuredUntil) && l.status === "ACTIVE";
  return (
    <div className="relative">
      <Link href={`/listings/${l.id}`} className="group flex h-full flex-col overflow-hidden rounded-lg border border-line bg-raised transition-colors hover:border-field">
        <div className="relative aspect-[4/3] bg-card">
          <Photo src={l.images[0]?.url} alt={`${l.year} ${l.brand} ${l.model}${l.images[0] ? "" : " (no photo)"}`} priority={priority} />
          {l.status === "SOLD" && <Chip tone="dark" className="absolute left-2 top-2 z-10">Sold</Chip>}
          {featured && <Chip tone="featured" className="absolute left-2 top-2 z-10">Featured</Chip>}
        </div>
        <div className="flex flex-1 flex-col p-3">
          <div className="truncate text-[15px] font-medium text-ink group-hover:text-brand">{l.year} {l.brand} {l.model}</div>
          <div className="mt-1 text-lg font-bold tabular-nums text-ink">
            {formatNpr(l.priceNpr)}
            {l.negotiable && <span className="ml-1.5 text-xs font-normal text-muted">negotiable</span>}
          </div>
          <div className="mt-auto pt-2 text-[13px] text-muted">
            <span className="tabular-nums">{formatKm(l.kmDriven)}</span>
            <span aria-hidden className="mx-1.5 text-muted-soft">|</span>
            {l.city}
          </div>
          {l.rating && <Stars avg={l.rating.avg} count={l.rating.count} className="mt-1 text-[13px]" />}
        </div>
      </Link>
      {compare && <CompareToggle id={l.id} label={`${l.brand} ${l.model}`} className="absolute right-2 top-2 z-20" />}
    </div>
  );
}
