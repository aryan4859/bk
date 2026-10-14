import Link from "next/link";
import { formatKm, formatNpr } from "@/lib/format";
import { Photo } from "./Photo";
import { Chip } from "./ui/Chip";

type Props = {
  listing: {
    id: string; title: string; priceNpr: number; year: number; kmDriven: number;
    city: string; brand: string; model: string; negotiable: boolean;
    status: string; images: { url: string }[];
  };
};

export function ListingCard({ listing: l }: Props) {
  return (
    <Link href={`/listings/${l.id}`} className="group block">
      <div className="relative aspect-[4/3] overflow-hidden rounded-md bg-wash">
        <div className="absolute inset-0 transition-transform duration-500 group-hover:scale-105">
          <Photo src={l.images[0]?.url} alt={`${l.year} ${l.brand} ${l.model}${l.images[0] ? "" : " (no photo)"}`} />
        </div>
        {l.status === "SOLD" && <Chip tone="dark" className="absolute left-2 top-2 z-10">Sold</Chip>}
        <Chip tone="price" className="absolute bottom-2 left-2 z-10">{formatNpr(l.priceNpr)}</Chip>
      </div>
      <div className="mt-3">
        <div className="truncate font-semibold group-hover:underline">{l.brand} {l.model}</div>
        <div className="text-sm text-muted">{l.year}, {formatKm(l.kmDriven)}</div>
        <div className="text-sm text-muted">{l.city}{l.negotiable ? ", negotiable" : ""}</div>
      </div>
    </Link>
  );
}
