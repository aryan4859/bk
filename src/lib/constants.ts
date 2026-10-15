export const BRANDS = [
  "Bajaj", "Hero", "Honda", "Yamaha", "TVS", "Suzuki", "Royal Enfield", "KTM",
  "Mahindra", "Vespa", "Aprilia", "Benelli", "CFMoto", "Husqvarna", "Other",
] as const;

export const CITIES = [
  "Kathmandu", "Lalitpur", "Bhaktapur", "Pokhara", "Biratnagar", "Birgunj",
  "Butwal", "Bharatpur", "Dharan", "Hetauda", "Nepalgunj", "Dhangadhi",
  "Janakpur", "Itahari", "Other",
] as const;

export const TYPE_LABEL = { MOTORCYCLE: "Motorcycle", SCOOTER: "Scooter" } as const;

export const SORTS = {
  newest: "Newest first",
  price_asc: "Price: low to high",
  price_desc: "Price: high to low",
  km_asc: "Lowest mileage",
  year_desc: "Newest model year",
} as const;

export const MAX_IMAGES = 4;
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

/** Durations (days) an admin can feature an ad for. */
export const FEATURE_DAYS = [7, 14, 30] as const;

/** Price bands for "Explore by budget" and the hero search. `min`/`max` are inclusive rupees; the URL uses `budget=<key>`. */
export const BUDGETS = [
  { key: "under-1l", label: "Under Rs 1 lakh", min: undefined, max: 99_999 },
  { key: "1l-2l", label: "Rs 1 to 2 lakh", min: 100_000, max: 199_999 },
  { key: "2l-3l", label: "Rs 2 to 3 lakh", min: 200_000, max: 299_999 },
  { key: "3l-5l", label: "Rs 3 to 5 lakh", min: 300_000, max: 499_999 },
  { key: "over-5l", label: "Over Rs 5 lakh", min: 500_000, max: undefined },
] as const;
