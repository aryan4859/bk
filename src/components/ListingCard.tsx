import Link from "next/link";
import { formatKm, formatNpr } from "@/lib/format";
import { Photo } from "./Photo";

type Props = {
  listing: {
    id: string; title: string; priceNpr: number; year: number; kmDriven: number;
    city: string; brand: string; model: string; negotiable: boolean;
    status: string; images: { url: string }[];
  };
};

export function ListingCard({ listing: l }: Props) {
  return (
    <Link href={`/listings/${l.id}`} className="group block overflow-hidden rounded-lg border border-line bg-card transition-colors hover:border-ink">
      <div className="relative aspect-[4/3] bg-wash">
        <Photo src={l.images[0]?.url} alt={l.title} />
        {l.status === "SOLD" && (
          <span className="absolute left-2 top-2 rounded bg-ink px-2 py-0.5 text-xs font-medium text-white">Sold</span>
        )}
      </div>
      <div className="p-3">
        <div className="text-lg font-semibold">
          {formatNpr(l.priceNpr)}
          {l.negotiable && <span className="ml-2 text-xs font-normal text-muted">negotiable</span>}
        </div>
        <div className="mt-0.5 truncate text-[15px]">{l.brand} {l.model}</div>
        <div className="mt-1 text-sm text-muted">
          {l.year} · {formatKm(l.kmDriven)} · {l.city}
        </div>
      </div>
    </Link>
  );
}
