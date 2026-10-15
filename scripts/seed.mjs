// Demo data: `npm run seed` (reads .env). Photos go to Cloudflare R2 when the R2_* variables are set.
// Re-running replaces the previous demo data (everything tied to @demo.test accounts).
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { PrismaClient } from "@prisma/client";
import { randomBytes } from "crypto";
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "fs";
import { deflateSync } from "zlib";

const db = new PrismaClient();
// Seeding a database that is not on this machine means the ads appear on a public site: label them as
// demos and give them numbers that can never ring a real phone.
const dbHost = (() => { try { return new URL(process.env.DATABASE_URL ?? "").hostname; } catch { return "localhost"; } })();
const LIVE = !["localhost", "127.0.0.1", "::1", ""].includes(dbHost);
mkdirSync("uploads", { recursive: true });

// deterministic pseudo-random so reruns look alike
let seed = 42;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296);
const pick = (a) => a[Math.floor(rnd() * a.length)];
const int = (lo, hi) => lo + Math.floor(rnd() * (hi - lo + 1));

// ---- placeholder photos: soft gradient with a simple bike silhouette-ish band ----
function crc32(buf) {
  let c, crc = ~0;
  for (const b of buf) { c = (crc ^ b) & 0xff; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; crc = (crc >>> 8) ^ c; }
  return ~crc >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
function png([r, g, b]) {
  const w = 480, h = 360;
  const raw = Buffer.alloc((w * 3 + 1) * h);
  for (let y = 0; y < h; y++) {
    const o = y * (w * 3 + 1);
    const shade = 1.15 - (y / h) * 0.55; // lighter at the top
    for (let x = 0; x < w; x++) {
      const road = y > h * 0.78;
      const k = road ? 0.35 : shade;
      raw[o + 1 + x * 3] = Math.min(255, r * k);
      raw[o + 2 + x * 3] = Math.min(255, g * k);
      raw[o + 3 + x * 3] = Math.min(255, b * k);
    }
  }
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 2;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", ihdr), chunk("IDAT", deflateSync(raw, { level: 9 })), chunk("IEND", Buffer.alloc(0))]);
}
// ---- where photos go: Cloudflare R2 when configured (same R2_* variables as the app), else ./uploads ----
const R2_VARS = ["R2_ACCOUNT_ID", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "R2_BUCKET", "R2_PUBLIC_URL"];
const r2Set = R2_VARS.filter((k) => process.env[k]?.trim());
if (r2Set.length && r2Set.length < R2_VARS.length) throw new Error(`R2 is half configured. Missing: ${R2_VARS.filter((k) => !r2Set.includes(k)).join(", ")}`);
const r2 = r2Set.length
  ? {
      bucket: process.env.R2_BUCKET.trim(),
      publicUrl: process.env.R2_PUBLIC_URL.trim().replace(/\/+$/, ""),
      s3: new S3Client({
        region: "auto",
        endpoint: process.env.R2_ENDPOINT?.trim() || `https://${process.env.R2_ACCOUNT_ID.trim()}.r2.cloudflarestorage.com`,
        forcePathStyle: true,
        credentials: { accessKeyId: process.env.R2_ACCESS_KEY_ID.trim(), secretAccessKey: process.env.R2_SECRET_ACCESS_KEY.trim() },
      }),
    }
  : null;
// Demo photos get fixed keys under demo/ and are uploaded once per run, so every listing that uses a
// photo shares one object and re-seeding overwrites instead of piling up copies in the bucket.
const uploaded = new Map();
let uploads = 0;
async function demoObject(key, body, contentType) {
  if (!uploaded.has(key)) {
    uploaded.set(key, r2.s3.send(new PutObjectCommand({ Bucket: r2.bucket, Key: key, Body: body, ContentType: contentType, CacheControl: "public, max-age=86400" }))
      .then(() => { uploads++; return `${r2.publicUrl}/${key}`; }));
  }
  return uploaded.get(key);
}

async function photo(rgb) {
  if (r2) return demoObject(`demo/placeholder-${rgb.join("-")}.png`, png(rgb), "image/png");
  const name = randomBytes(12).toString("hex") + ".png";
  writeFileSync("uploads/" + name, png(rgb));
  return "/uploads/" + name;
}
// real photos from `npm run photos` (scripts/photos/<type>-<brand>-N.jpg); falls back to the gradient placeholders
const PHOTO_DIR = "scripts/photos";
const realPhotos = (type, brand) => {
  if (!existsSync(PHOTO_DIR)) return [];
  const slug = `${type}|${brand}`.toLowerCase().replace(/[^a-z]+/g, "-");
  return readdirSync(PHOTO_DIR).filter((f) => f.startsWith(slug + "-") && f.endsWith(".jpg"));
};
async function realPhoto(file) {
  if (r2) return demoObject(`demo/${file}`, readFileSync(`${PHOTO_DIR}/${file}`), "image/jpeg");
  const name = randomBytes(12).toString("hex") + ".jpg";
  copyFileSync(`${PHOTO_DIR}/${file}`, "uploads/" + name);
  return "/uploads/" + name;
}
const COLORS = [[170, 60, 50], [60, 90, 150], [60, 120, 90], [120, 120, 125], [200, 130, 50], [140, 60, 110], [40, 40, 45], [190, 170, 90]];

// ---- catalogue ----
const CATALOG = [
  ["MOTORCYCLE", "Bajaj", ["Pulsar 150", "Pulsar NS200", "Pulsar 220F", "Dominar 400", "Avenger 220"], 160000, 520000],
  ["MOTORCYCLE", "Yamaha", ["FZ-S V3", "FZ 25", "R15 V3", "MT-15", "Fazer"], 200000, 640000],
  ["MOTORCYCLE", "Honda", ["Shine", "Unicorn", "Hornet 160R", "CB350", "X-Blade"], 140000, 480000],
  ["MOTORCYCLE", "Hero", ["Splendor Plus", "Glamour", "Xtreme 160R", "Hunk 150"], 110000, 300000],
  ["MOTORCYCLE", "TVS", ["Apache RTR 160", "Apache RTR 200", "Raider 125"], 150000, 360000],
  ["MOTORCYCLE", "Royal Enfield", ["Classic 350", "Himalayan", "Bullet 350", "Meteor 350", "Hunter 350"], 300000, 800000],
  ["MOTORCYCLE", "KTM", ["Duke 200", "Duke 250", "RC 200"], 280000, 560000],
  ["MOTORCYCLE", "Suzuki", ["Gixxer SF", "Gixxer 250", "Intruder"], 220000, 520000],
  ["MOTORCYCLE", "Benelli", ["TNT 300", "Imperiale 400"], 450000, 700000],
  ["SCOOTER", "Honda", ["Dio", "Activa 6G", "Grazia", "Navi"], 130000, 280000],
  ["SCOOTER", "Suzuki", ["Access 125", "Burgman Street", "Avenis"], 170000, 320000],
  ["SCOOTER", "Yamaha", ["Fascino", "Ray ZR", "Aerox 155"], 150000, 360000],
  ["SCOOTER", "TVS", ["Jupiter", "NTorq 125", "Scooty Pep"], 120000, 280000],
  ["SCOOTER", "Vespa", ["VXL 150", "SXL 125"], 250000, 450000],
  ["SCOOTER", "Hero", ["Maestro Edge", "Pleasure Plus"], 110000, 220000],
];
const CITIES = ["Kathmandu", "Kathmandu", "Kathmandu", "Lalitpur", "Lalitpur", "Bhaktapur", "Pokhara", "Pokhara", "Biratnagar", "Birgunj", "Butwal", "Bharatpur", "Dharan", "Hetauda", "Nepalgunj", "Itahari"];
const NAMES = ["Aarav Shrestha", "Sujan Gurung", "Bikash Thapa", "Anil Rai", "Pratik Karki", "Sabin Maharjan", "Nirajan Adhikari", "Roshan Tamang", "Dipesh Basnet", "Kiran Limbu", "Sandesh Pandey", "Manish Poudel"];
const NOTES = [
  "Single owner, always parked indoors. Regular servicing at the authorised service centre.",
  "No accidents, no major scratches. Tyres changed recently. Papers are all clear.",
  "Smooth engine, good mileage. Selling because I am upgrading to a bigger bike.",
  "Original paint, minor wear on the seat. New battery installed last month. Test ride welcome.",
  "Used mostly for weekend rides. Chain set and brake pads replaced. Bluebook and tax up to date.",
  "Going abroad, need to sell quickly. Everything works perfectly. Price slightly negotiable.",
  "Second owner. Engine recently overhauled, runs like new. Insurance valid till next year.",
];

// ---- wipe previous demo data ----
const old = await db.user.findMany({ where: { email: { endsWith: "@demo.test" } }, select: { id: true } });
const oldIds = old.map((u) => u.id);
await db.review.deleteMany({ where: { OR: [{ sellerId: { in: oldIds } }, { reviewerId: { in: oldIds } }] } });
await db.savedSearch.deleteMany({ where: { userId: { in: oldIds } } });
await db.message.deleteMany({ where: { OR: [{ senderId: { in: oldIds } }, { thread: { listing: { sellerId: { in: oldIds } } } }] } });
await db.thread.deleteMany({ where: { OR: [{ buyerId: { in: oldIds } }, { listing: { sellerId: { in: oldIds } } }] } });
await db.report.deleteMany({ where: { OR: [{ reporterId: { in: oldIds } }, { listing: { sellerId: { in: oldIds } } }] } });
await db.listing.deleteMany({ where: { sellerId: { in: oldIds } } });
await db.user.deleteMany({ where: { id: { in: oldIds } } });

// ---- users ----
const users = [];
for (let i = 0; i < NAMES.length; i++) {
  users.push(await db.user.create({ data: { email: `demo${i + 1}@demo.test`, name: NAMES[i], createdAt: new Date(Date.now() - int(5, 60) * 86400_000) } }));
}

// ---- listings ----
const COUNT = 48;
const listings = [];
for (let n = 0; n < COUNT; n++) {
  const [type, brand, models, lo, hi] = pick(CATALOG);
  const model = pick(models);
  const year = int(2012, 2025);
  const age = 2026 - year;
  const kmDriven = Math.max(500, Math.round((age * int(3000, 9000)) / 100) * 100);
  const depreciation = Math.max(0.35, 1 - age * 0.07);
  const priceNpr = Math.round((lo + rnd() * (hi - lo)) * depreciation / 5000) * 5000;
  const status = n < 36 ? "ACTIVE" : n < 42 ? "PENDING" : n < 46 ? "SOLD" : "REJECTED";
  const seller = users[n % users.length];
  const base = pick(COLORS);
  const real = realPhotos(type, brand);
  const imgCount = real.length ? Math.min(real.length, int(1, 4)) : int(1, 4);
  const start = real.length ? int(0, real.length - 1) : 0;
  // same order of random draws as before, so the demo data stays identical between runs
  const urls = [];
  for (let position = 0; position < imgCount; position++) {
    urls.push(real.length ? await realPhoto(real[(start + position) % real.length]) : await photo(base.map((c) => Math.max(0, Math.min(255, c + int(-25, 25))))));
  }
  const l = await db.listing.create({
    data: {
      sellerId: seller.id, type, brand, model, year, kmDriven, priceNpr,
      title: `${LIVE ? "Demo: " : ""}${brand} ${model} ${year}${rnd() > 0.5 ? ", " + pick(["single owner", "well maintained", "excellent condition", "lady driven", "showroom condition"]) : ""}`,
      description: pick(NOTES),
      ownerCount: rnd() > 0.7 ? 2 : 1,
      negotiable: rnd() > 0.3,
      city: pick(CITIES),
      phone: LIVE ? "97798000000" + String(n % 10) : "97798" + String(int(10000000, 99999999)),
      bluebookOk: rnd() > 0.15,
      status,
      rejectReason: status === "REJECTED" ? pick(["Photos do not show the bike.", "Price looks like a typo."]) : null,
      createdAt: new Date(Date.now() - int(0, 30) * 86400_000 - int(0, 20) * 3600_000),
      images: { create: urls.map((url, position) => ({ url, position })) },
    },
  });
  listings.push(l);
}

// ---- conversations, favourites, reports (only on live ads) ----
const live = listings.filter((l) => l.status === "ACTIVE");
const lines = [
  ["Is this still available?", "Yes, it is. When would you like to see it?"],
  ["Can you do a little less on the price?", "I can come down a bit if you take it this week."],
  ["Is the bluebook clear?", "Yes, all papers are ready. Bring your citizenship to transfer."],
  ["Can I test ride tomorrow evening?", "Sure, after 4pm works. I will share the location."],
];
for (let i = 0; i < 10; i++) {
  const l = live[i];
  const buyer = users.find((u) => u.id !== l.sellerId && !listings.some((x) => x.id === l.id && x.sellerId === u.id));
  const thread = await db.thread.create({ data: { listingId: l.id, buyerId: buyer.id } });
  const [q, a] = lines[i % lines.length];
  const t0 = Date.now() - int(1, 48) * 3600_000;
  await db.message.create({ data: { threadId: thread.id, senderId: buyer.id, body: q, createdAt: new Date(t0) } });
  if (i % 3 !== 2) await db.message.create({ data: { threadId: thread.id, senderId: l.sellerId, body: a, createdAt: new Date(t0 + 20 * 60_000) } });
}
for (const l of live.slice(0, 20)) {
  const u = users.find((x) => x.id !== l.sellerId && rnd() > 0.5) ?? users[0];
  if (u.id !== l.sellerId) await db.favorite.upsert({ where: { userId_listingId: { userId: u.id, listingId: l.id } }, update: {}, create: { userId: u.id, listingId: l.id } });
}
// a few boosted ads and seller reviews so the new features have something to show
for (const l of live.slice(0, 3)) await db.listing.update({ where: { id: l.id }, data: { featuredUntil: new Date(Date.now() + int(5, 25) * 86400_000) } });
const REVIEWS = ["Honest seller, the bike was exactly as described.", "Quick replies and easy paperwork.", "Bike was fine but the price did not move at all.", "Met in Kathmandu, no problems.", ""];
for (const seller of users.slice(0, 6)) {
  for (const reviewer of users.filter((u) => u.id !== seller.id).slice(0, int(1, 4))) {
    await db.review.create({ data: { sellerId: seller.id, reviewerId: reviewer.id, rating: int(3, 5), comment: pick(REVIEWS) || null } });
  }
}
const reasons = ["Photos look copied from another website.", "Price is far too low, could be a scam.", "Seller asked me to pay in advance."];
for (let i = 0; i < 3; i++) {
  const l = live[10 + i];
  const reporter = users.find((u) => u.id !== l.sellerId);
  await db.report.create({ data: { listingId: l.id, reporterId: reporter.id, reason: reasons[i] } });
}

console.log(r2 ? `Photos: ${uploads} uploaded to R2 bucket "${r2.bucket}" under demo/` : "Photos: saved to ./uploads");
console.log(LIVE ? `Database: ${dbHost} (live site: demo titles and fake phone numbers)` : "Database: local");
console.log(`Seeded ${users.length} users, ${listings.length} listings (${live.length} live), 10 conversations, 3 reports, 3 featured ads, reviews`);
await db.$disconnect();
