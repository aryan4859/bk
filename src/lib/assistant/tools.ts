import { BRANDS, CITIES, SORTS } from "../constants";
import { formatKm, formatNpr } from "../format";
import { parseFilters, searchListings } from "../queries";

export const SEARCH_TOOL = {
  type: "function",
  function: {
    name: "search_listings",
    description:
      "Search the bikes currently for sale on the site. Use it for any request to find, list, count or compare bikes for sale. " +
      "All fields are optional; leave out anything the visitor did not ask for. Returns up to 6 bikes and the total number that match.",
    parameters: {
      type: "object",
      additionalProperties: false,
      properties: {
        query: { type: "string", description: "Free-text keywords matched against title, model, brand and description, e.g. \"NS200\" or \"single owner\"." },
        type: { type: "string", enum: ["MOTORCYCLE", "SCOOTER"] },
        brand: { type: "string", enum: BRANDS.filter((b) => b !== "Other") },
        model: { type: "string", description: "Model name, partial match, e.g. \"Pulsar\" or \"Activa\"." },
        city: { type: "string", enum: CITIES.filter((c) => c !== "Other") },
        minPrice: { type: "integer", minimum: 0, description: "Lowest price in Nepali rupees." },
        maxPrice: { type: "integer", minimum: 0, description: "Highest price in Nepali rupees (1 lakh = 100000)." },
        minYear: { type: "integer", minimum: 1990, description: "Oldest model year (AD) wanted." },
        maxKm: { type: "integer", minimum: 0, description: "Most kilometres driven." },
        sort: { type: "string", enum: Object.keys(SORTS) },
      },
    },
  },
} as const;

export type ListingCard = { id: string; title: string; priceNpr: number; year: number; kmDriven: number; city: string; image: string | null };

const str = (v: unknown) => (typeof v === "string" ? v.slice(0, 80) : undefined);
const int = (v: unknown) => (typeof v === "number" && Number.isFinite(v) && v >= 0 ? String(Math.floor(v)) : undefined);

/** Runs a search_listings call. Arguments come from the model, so every field is checked again by parseFilters. */
export async function runSearch(args: Record<string, unknown>) {
  const f = parseFilters({
    q: str(args.query), type: str(args.type), brand: str(args.brand), model: str(args.model), city: str(args.city),
    minPrice: int(args.minPrice), maxPrice: int(args.maxPrice), minYear: int(args.minYear), maxKm: int(args.maxKm), sort: str(args.sort),
  });
  const { items, featured, total } = await searchListings(f);
  const bikes = [...featured, ...items].slice(0, 6);
  // what the model sees: public facts only (no phone numbers or seller details)
  const forModel = {
    total,
    bikes: bikes.map((l) => ({
      title: l.title, brand: l.brand, model: l.model, year: l.year, price: formatNpr(l.priceNpr), negotiable: l.negotiable,
      driven: formatKm(l.kmDriven), city: l.city, link: `/listings/${l.id}`,
    })),
  };
  const cards: ListingCard[] = bikes.map((l) => ({ id: l.id, title: `${l.year} ${l.brand} ${l.model}`, priceNpr: l.priceNpr, year: l.year, kmDriven: l.kmDriven, city: l.city, image: l.images[0]?.url ?? null }));
  return { forModel, cards };
}
