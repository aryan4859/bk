import { BRANDS } from "./constants";

export type BikeType = "MOTORCYCLE" | "SCOOTER";
type Brand = Exclude<(typeof BRANDS)[number], "Other">;

/**
 * Models each brand sells (or sold) in Nepal, split by type, for the search pickers. Not exhaustive history:
 * anything sellers list that is missing here is merged in from the database by modelGroups().
 */
export const CATALOG: Record<Brand, Record<BikeType, string[]>> = {
  Bajaj: {
    MOTORCYCLE: [
      "Platina 100", "Platina 110", "CT 110", "Discover 125", "Freedom 125",
      "Pulsar 125", "Pulsar 150", "Pulsar 180", "Pulsar 220F", "Pulsar N150", "Pulsar N160", "Pulsar N250",
      "Pulsar NS125", "Pulsar NS160", "Pulsar NS200", "Pulsar RS200", "Pulsar F250",
      "Avenger Street 160", "Avenger Cruise 220", "Dominar 250", "Dominar 400",
    ],
    SCOOTER: ["Chetak"],
  },
  Hero: {
    MOTORCYCLE: [
      "HF Deluxe", "Splendor Plus", "Super Splendor", "Passion Pro", "Glamour", "Hunk 150",
      "Xtreme 125R", "Xtreme 160R", "Xtreme 200S", "Xpulse 200", "Xpulse 200 4V", "Karizma XMR", "Mavrick 440",
    ],
    SCOOTER: ["Pleasure Plus", "Maestro Edge 110", "Maestro Edge 125", "Destini 125", "Xoom 110", "Vida V1"],
  },
  Honda: {
    MOTORCYCLE: [
      "Shine 100", "Shine 125", "SP 125", "Livo", "Unicorn", "SP 160", "X-Blade", "Hornet 160R", "Hornet 2.0",
      "XR190L", "CB200X", "CB350", "CB350RS", "H'ness CB350", "CBR250R", "CRF250L",
    ],
    SCOOTER: ["Dio", "Activa 6G", "Activa 125", "Grazia", "Navi"],
  },
  Yamaha: {
    MOTORCYCLE: ["Crux", "Saluto", "SZ-RR", "FZ-S", "FZ-X", "FZ25", "Fazer 25", "MT-15", "R15S", "R15 V4"],
    SCOOTER: ["Alpha", "Ray ZR 125", "Fascino 125", "Aerox 155"],
  },
  TVS: {
    MOTORCYCLE: [
      "XL100", "Sport", "Star City Plus", "Radeon", "Raider 125", "Apache RTR 160", "Apache RTR 160 4V",
      "Apache RTR 180", "Apache RTR 200 4V", "Apache RR 310", "Ronin",
    ],
    SCOOTER: ["Pep Plus", "Zest 110", "Wego", "Jupiter", "Jupiter 125", "NTorq 125", "iQube"],
  },
  Suzuki: {
    MOTORCYCLE: ["Hayate", "Intruder", "GSX-R150", "Gixxer", "Gixxer SF", "Gixxer 250", "Gixxer SF 250", "V-Strom SX"],
    SCOOTER: ["Let's", "Access 125", "Avenis", "Burgman Street"],
  },
  "Royal Enfield": {
    MOTORCYCLE: [
      "Bullet 350", "Classic 350", "Classic 500", "Thunderbird 350", "Hunter 350", "Meteor 350", "Scram 411",
      "Himalayan", "Himalayan 450", "Guerrilla 450", "Interceptor 650", "Continental GT 650", "Super Meteor 650", "Shotgun 650",
    ],
    SCOOTER: [],
  },
  KTM: {
    MOTORCYCLE: ["Duke 125", "Duke 200", "Duke 250", "Duke 390", "RC 125", "RC 200", "RC 390", "250 Adventure", "390 Adventure"],
    SCOOTER: [],
  },
  Mahindra: {
    MOTORCYCLE: ["Centuro", "Mojo 300"],
    SCOOTER: ["Rodeo", "Duro", "Gusto"],
  },
  Vespa: {
    MOTORCYCLE: [],
    SCOOTER: ["VXL 125", "VXL 150", "SXL 125", "SXL 150", "ZX 125", "Notte 125", "Elegante 150"],
  },
  Aprilia: {
    MOTORCYCLE: ["RS 457", "Tuono 457"],
    SCOOTER: ["SR 125", "SR 160", "SXR 125", "SXR 160", "Storm 125"],
  },
  Benelli: {
    MOTORCYCLE: ["TNT 135", "TNT 150", "TNT 300", "302R", "Leoncino 250", "Leoncino 500", "Imperiale 400", "TRK 251", "TRK 502"],
    SCOOTER: [],
  },
  CFMoto: {
    MOTORCYCLE: ["250NK", "300NK", "300SR", "450NK", "450SR", "650NK", "650MT", "700CL-X"],
    SCOOTER: [],
  },
  Husqvarna: {
    MOTORCYCLE: ["Svartpilen 250", "Svartpilen 401", "Vitpilen 250", "Vitpilen 401"],
    SCOOTER: [],
  },  Ampere: {
    MOTORCYCLE: [],
    SCOOTER: ["Magnus EX", "Reo", "Primus", "Nexus", "Zeal"],
  },
  Ather: {
    MOTORCYCLE: [],
    SCOOTER: ["450S", "450X", "450 Apex", "Rizta"],
  },
  BMW: {
    MOTORCYCLE: ["G 310 R", "G 310 GS", "G 310 RR", "F 900 R", "F 850 GS", "F 900 GS", "R 1250 GS", "R 1300 GS", "S 1000 RR", "M 1000 RR"],
    SCOOTER: ["C 400 X", "C 400 GT", "CE 04"],
  },
  // an empty range means we don't know the Nepal lineup yet: the brand is offered for any type and its
  // models come from the ads people post
  Crossfire: { MOTORCYCLE: [], SCOOTER: [] },
  CX: { MOTORCYCLE: [], SCOOTER: [] },
  Ducati: {
    MOTORCYCLE: [
      "Monster", "Scrambler Icon", "Scrambler Full Throttle", "Scrambler Nightshift", "Panigale V2", "Panigale V4",
      "Streetfighter V2", "Streetfighter V4", "Multistrada V2", "Multistrada V4", "Diavel V4", "DesertX", "Hypermotard 950",
    ],
    SCOOTER: [],
  },
  Garow: { MOTORCYCLE: [], SCOOTER: [] },
  Hartford: { MOTORCYCLE: [], SCOOTER: [] },
  Jawa: {
    MOTORCYCLE: ["Jawa 42", "42 Bobber", "Jawa 350", "Perak"],
    SCOOTER: [],
  },
  Keren: { MOTORCYCLE: [], SCOOTER: [] },
  Morbidelli: {
    MOTORCYCLE: ["C252V", "T502X"],
    SCOOTER: [],
  },
  Motorhead: { MOTORCYCLE: [], SCOOTER: [] },
  "MV Agusta": {
    MOTORCYCLE: ["Brutale 800", "Dragster 800", "F3 800", "Superveloce 800", "Turismo Veloce 800", "Enduro Veloce"],
    SCOOTER: [],
  },
  Niu: {
    MOTORCYCLE: [],
    SCOOTER: ["NQi", "MQi", "UQi", "MQi GT"],
  },
  Revolt: {
    MOTORCYCLE: ["RV400", "RV400 BRZ", "RV1", "RV1+", "RV BlazeX"],
    SCOOTER: [],
  },
  Segway: {
    MOTORCYCLE: [],
    SCOOTER: ["E110S", "E125S", "E300SE"],
  },
  "Super Soco": {
    MOTORCYCLE: ["TC", "TC Max", "TSX"],
    SCOOTER: ["CUx", "CPx"],
  },
  Triumph: {
    MOTORCYCLE: [
      "Speed 400", "Scrambler 400 X", "Trident 660", "Street Triple R", "Street Triple RS", "Tiger Sport 660",
      "Tiger 900", "Bonneville T100", "Bonneville T120", "Speed Twin 900", "Speed Twin 1200", "Rocket 3",
    ],
    SCOOTER: [],
  },
  Ultraviolette: {
    MOTORCYCLE: ["F77", "F77 Mach 2"],
    SCOOTER: [],
  },
  Yadea: {
    MOTORCYCLE: [],
    SCOOTER: ["G5", "C1S", "E8S"],
  },
  Yatri: {
    MOTORCYCLE: ["P-0", "P-1"],
    SCOOTER: [],
  },
  Yezdi: {
    MOTORCYCLE: ["Roadster", "Scrambler", "Adventure"],
    SCOOTER: [],
  },
  Zeeho: {
    MOTORCYCLE: [],
    SCOOTER: ["AE8"],
  },
  Zonsen: { MOTORCYCLE: [], SCOOTER: [] },
  Zontes: {
    MOTORCYCLE: ["ZT125-U", "350R", "350T", "350X"],
    SCOOTER: ["350D", "350E"],
  },
  Zuumav: { MOTORCYCLE: [], SCOOTER: [] },
  ZXMoto: {
    MOTORCYCLE: ["820RR-RS"],
    SCOOTER: [],
  },
};

/** One live (brand, model, type) combination and how many ads it has. */
export type Listed = { brand: string; model: string; type: BikeType; n: number };
export type ModelOption = { name: string; n: number };
export type ModelGroup = { label: string; models: ModelOption[] };

// "Pulsar NS200", "pulsar ns 200" and "Pulsar-NS200" are the same bike
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
const TYPES: BikeType[] = ["MOTORCYCLE", "SCOOTER"];
const TYPE_GROUP = { MOTORCYCLE: "Motorcycles", SCOOTER: "Scooters" } as const;

/** Catalogue models of one brand and type, plus any listed ones the catalogue lacks, each with its live ad count. */
function modelsOf(brand: Brand, type: BikeType, listed: Listed[]): ModelOption[] {
  const ads = listed.filter((l) => l.brand === brand && l.type === type);
  const count = (name: string) => ads.filter((l) => norm(l.model) === norm(name)).reduce((s, l) => s + l.n, 0);
  const out = CATALOG[brand][type].map((name) => ({ name, n: count(name) }));
  for (const l of ads) {
    if (!out.some((o) => norm(o.name) === norm(l.model))) out.push({ name: l.model, n: count(l.model) });
  }
  return out;
}

/** Brands offered for a type ("" = all types): only those that make that kind of bike or have one listed. */
export function brandsFor(type: BikeType | "", listed: Listed[] = []): Brand[] {
  const types = type ? [type] : TYPES;
  const unknownRange = (b: Brand) => TYPES.every((t) => CATALOG[b][t].length === 0);
  return (Object.keys(CATALOG) as Brand[]).filter((b) => unknownRange(b) || types.some((t) => modelsOf(b, t, listed).length > 0));
}

/**
 * Option groups for the model picker. With a brand: grouped by type (just the one when a type is picked).
 * Without one: grouped by brand, limited to the picked type.
 */
export function modelGroups(type: BikeType | "", brand: string, listed: Listed[] = []): ModelGroup[] {
  const types = type ? [type] : TYPES;
  if (brand && brand in CATALOG) {
    const b = brand as Brand;
    const groups = types.map((t) => ({ label: type ? b : `${b} ${TYPE_GROUP[t].toLowerCase()}`, models: modelsOf(b, t, listed) }));
    return groups.filter((g) => g.models.length > 0);
  }
  return brandsFor(type, listed)
    .map((b) => ({ label: b, models: types.flatMap((t) => modelsOf(b, t, listed)) }))
    .filter((g) => g.models.length > 0);
}
