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
