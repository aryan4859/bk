// Downloads freely licensed bike photos from Wikimedia Commons into scripts/photos/ for `npm run seed`.
// Usage: `npm run photos`. Licenses/authors are recorded in scripts/photos/CREDITS.json.
import { mkdirSync, writeFileSync } from "fs";

const OUT = "scripts/photos";
const PER_KEY = 4;
const UA = "bk-demo-seed/1.0 (local development)";
mkdirSync(OUT, { recursive: true });

// key = `${type}|${brand}` as used in seed.mjs
const QUERIES = {
  "MOTORCYCLE|Bajaj": ["Bajaj Pulsar", "Bajaj Dominar", "Bajaj Avenger"],
  "MOTORCYCLE|Yamaha": ["Yamaha FZ motorcycle", "Yamaha R15", "Yamaha MT-15"],
  "MOTORCYCLE|Honda": ["Honda Shine motorcycle", "Honda Unicorn", "Honda Hornet 160R", "Honda CB350"],
  "MOTORCYCLE|Hero": ["Hero Splendor", "Hero Glamour", "Hero Xtreme"],
  "MOTORCYCLE|TVS": ["TVS Apache", "TVS Raider"],
  "MOTORCYCLE|Royal Enfield": ["Royal Enfield Classic 350", "Royal Enfield Himalayan", "Royal Enfield Bullet"],
  "MOTORCYCLE|KTM": ["KTM Duke 200", "KTM Duke 390", "KTM RC 200"],
  "MOTORCYCLE|Suzuki": ["Suzuki Gixxer", "Suzuki Intruder"],
  "MOTORCYCLE|Benelli": ["Benelli TNT 300", "Benelli Imperiale 400"],
  "SCOOTER|Honda": ["Honda Activa", "Honda Dio scooter", "Honda Grazia"],
  "SCOOTER|Suzuki": ["Suzuki Access 125", "Suzuki Burgman Street"],
  "SCOOTER|Yamaha": ["Yamaha Fascino", "Yamaha Ray ZR", "Yamaha Aerox 155"],
  "SCOOTER|TVS": ["TVS Jupiter", "TVS NTorq", "TVS Scooty"],
  "SCOOTER|Vespa": ["Vespa scooter"],
  "SCOOTER|Hero": ["Hero Maestro Edge", "Hero Pleasure"],
};
const BAD_TITLE = /speedometer|head ?light|engine|dashboard|meter|logo|badge|mirror|tail ?light|wheel|tyre|seat|interior|cluster|exhaust|diagram|\.svg/i;
const OK_LICENSE = /^(CC0|CC BY|CC BY-SA|Public domain)/i;

const strip = (s = "") => s.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function search(q) {
  const u = new URL("https://commons.wikimedia.org/w/api.php");
  for (const [k, v] of Object.entries({
    action: "query", generator: "search", gsrnamespace: 6, gsrsearch: `${q} filetype:bitmap`, gsrlimit: 30,
    prop: "imageinfo", iiprop: "url|extmetadata|size|mime", iiurlwidth: 960, format: "json",
  })) u.searchParams.set(k, v);
  let res = await fetch(u, { headers: { "user-agent": UA } });
  for (let t = 0; res.status === 429 && t < 5; t++) { await sleep(5000 * (t + 1)); res = await fetch(u, { headers: { "user-agent": UA } }); }
  if (!res.ok) throw new Error(`search ${q}: ${res.status}`);
  const pages = Object.values((await res.json()).query?.pages ?? {});
  return pages.map((p) => ({ title: p.title, ...p.imageinfo[0] })).filter((i) =>
    i.mime === "image/jpeg" && i.width >= 1200 && i.width > i.height * 1.15 && i.height > 700 &&
    !BAD_TITLE.test(i.title) && OK_LICENSE.test(i.extmetadata?.LicenseShortName?.value ?? ""));
}

const credits = [];
for (const [key, queries] of Object.entries(QUERIES)) {
  const picked = [];
  for (const q of queries) {
    if (picked.length >= PER_KEY) break;
    for (const c of await search(q)) {
      if (picked.length >= PER_KEY) break;
      if (!picked.some((p) => p.title === c.title)) picked.push(c);
    }
    await sleep(500);
  }
  const slug = key.toLowerCase().replace(/[^a-z]+/g, "-");
  for (const [n, c] of picked.entries()) {
    const file = `${slug}-${n + 1}.jpg`;
    let res = await fetch(c.thumburl, { headers: { "user-agent": UA } });
    for (let t = 0; res.status === 429 && t < 4; t++) { await sleep(3000 * (t + 1)); res = await fetch(c.thumburl, { headers: { "user-agent": UA } }); }
    if (!res.ok) { console.warn(`skip ${c.title}: ${res.status}`); continue; }
    writeFileSync(`${OUT}/${file}`, Buffer.from(await res.arrayBuffer()));
    credits.push({
      file, key, title: c.title, source: c.descriptionurl,
      author: strip(c.extmetadata?.Artist?.value), license: c.extmetadata?.LicenseShortName?.value,
    });
    await sleep(500);
  }
  console.log(`${key}: ${picked.length} photo(s)`);
}
writeFileSync(`${OUT}/CREDITS.json`, JSON.stringify(credits, null, 2));
console.log(`Saved ${credits.length} photos to ${OUT}/ (credits in CREDITS.json)`);
