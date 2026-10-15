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
  /** position in its grid, for the staggered entrance */
  index?: number;
};

export function ListingCard({ listing: l, compare = false, priority = false, index = 0 }: Props) {
  const featured = isFeaturedNow(l.featuredUntil) && l.status === "ACTIVE";
  return (
    <div className="relative" data-reveal style={{ "--i": index % 4 } as React.CSSProperties}>
      <Link href={`/listings/${l.id}`} className="group block">
        <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-card">
          <div className="absolute inset-0 transition-transform duration-500 group-hover:scale-105">
            <Photo src={l.images[0]?.url} alt={`${l.year} ${l.brand} ${l.model}${l.images[0] ? "" : " (no photo)"}`} priority={priority} />
          </div>
          {l.status === "SOLD" && <Chip tone="dark" className="absolute left-2 top-2 z-10">Sold</Chip>}
          {featured && <Chip tone="featured" className="absolute left-2 top-2 z-10">Featured</Chip>}
          <Chip tone="price" className="absolute bottom-2 left-2 z-10 !text-base sm:!text-lg">{formatNpr(l.priceNpr)}</Chip>
        </div>
        <div className="mt-3">
          <div className="truncate font-medium text-ink group-hover:underline">{l.brand} {l.model}</div>
          <div className="text-sm text-muted">{l.year}, {formatKm(l.kmDriven)}</div>
          <div className="text-sm text-muted">{l.city}{l.negotiable ? ", negotiable" : ""}</div>
          {l.rating && <Stars avg={l.rating.avg} count={l.rating.count} className="mt-0.5 text-sm" />}
        </div>
      </Link>
      {compare && <CompareToggle id={l.id} label={`${l.brand} ${l.model}`} className="absolute right-2 top-2 z-20" />}
    </div>
  );
}
