// Load-times the production build against a large synthetic dataset in the TEST database.
// Usage: node scripts/perf.mjs <label>   (needs `next build` done; writes perf-results/perf-<label>.json)
import { spawn } from "node:child_process";
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { gzipSync } from "node:zlib";
import { chromium } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { parse } from "dotenv";
import { SignJWT } from "jose";

const label = process.argv[2] ?? "run";
const N_LISTINGS = Number(process.env.PERF_LISTINGS ?? 3000);
const PORT = 3101;
const env = (() => { try { return parse(readFileSync(".env")); } catch { return {}; } })();
const base = new URL(process.env.DATABASE_URL ?? env.DATABASE_URL);
base.pathname = "/motovo_test";
const DB = base.toString();
const SECRET = process.env.AUTH_SECRET ?? env.AUTH_SECRET;

const db = new PrismaClient({ datasources: { db: { url: DB } } });
await db.$executeRawUnsafe('TRUNCATE "SearchMatch","SavedSearch","Review","Favorite","Report","Message","Thread","Image","Listing","Otp","RateLimit","User" RESTART IDENTITY CASCADE');

// ---------- synthetic data ----------
let seed = 7; const rnd = () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296);
const pick = (a) => a[Math.floor(rnd() * a.length)];
const photos = readdirSync("uploads").filter((f) => /^[a-f0-9]{24}\.(jpg|webp)$/.test(f)).slice(0, 40).map((f) => "/uploads/" + f);
const brands = ["Bajaj", "Hero", "Honda", "Yamaha", "TVS", "Suzuki", "Royal Enfield", "KTM"];
const cities = ["Kathmandu", "Lalitpur", "Pokhara", "Biratnagar", "Butwal", "Bharatpur"];
const models = ["Pulsar", "Splendor", "Shine", "FZ", "Apache", "Gixxer", "Classic", "Duke", "Dio", "Activa"];
const users = await Promise.all(Array.from({ length: 200 }, (_, i) => db.user.create({ data: { email: `perf${i}@perf.test`, name: `Seller ${i}` } })));

const long = "Single owner, regular servicing at the authorised centre, no accidents, new tyres and battery. ".repeat(20).slice(0, 1500);
const rows = Array.from({ length: N_LISTINGS }, (_, i) => {
  const brand = pick(brands), model = pick(models), year = 2012 + Math.floor(rnd() * 14);
  return {
    sellerId: pick(users).id, title: `${brand} ${model} ${year} #${i}`, description: long, type: rnd() > 0.3 ? "MOTORCYCLE" : "SCOOTER",
    brand, model, year, kmDriven: Math.floor(rnd() * 80000), ownerCount: 1, priceNpr: 80000 + Math.floor(rnd() * 600000),
    city: pick(cities), phone: "9779841234567", status: i % 12 === 0 ? "PENDING" : "ACTIVE",
    featuredUntil: i % 400 === 0 ? new Date(Date.now() + 5 * 86_400_000) : null,
    createdAt: new Date(Date.now() - Math.floor(rnd() * 90) * 86_400_000 - i * 1000),
  };
});
await db.listing.createMany({ data: rows });
const all = await db.listing.findMany({ select: { id: true, sellerId: true } });
await db.image.createMany({ data: all.flatMap((l) => Array.from({ length: 1 + Math.floor(rnd() * 3) }, (_, p) => ({ listingId: l.id, url: pick(photos), position: p }))) });
const reviewers = users.slice(0, 40);
await db.review.createMany({ data: users.slice(40, 120).flatMap((s) => reviewers.slice(0, 3 + Math.floor(rnd() * 5)).map((r) => ({ sellerId: s.id, reviewerId: r.id, rating: 3 + Math.floor(rnd() * 3) }))), skipDuplicates: true });
const buyer = users[0];
await db.thread.createMany({ data: all.slice(0, 60).filter((l) => l.sellerId !== buyer.id).map((l) => ({ listingId: l.id, buyerId: buyer.id })), skipDuplicates: true });
const threads = await db.thread.findMany({ where: { buyerId: buyer.id } });
await db.message.createMany({ data: threads.flatMap((t) => Array.from({ length: 20 }, (_, i) => ({ threadId: t.id, senderId: i % 2 ? buyer.id : users[1].id, body: "hello ".repeat(5) }))) });
const sample = (await db.listing.findMany({ where: { status: "ACTIVE" }, take: 3, orderBy: { createdAt: "desc" }, select: { id: true, sellerId: true } }));
await db.$disconnect();
console.log(`seeded ${N_LISTINGS} listings`);

// ---------- server ----------
const server = spawn("npx", ["next", "start", "-p", String(PORT)], {
  env: { ...process.env, DATABASE_URL: DB, AUTH_SECRET: SECRET, R2_ACCOUNT_ID: "", R2_ACCESS_KEY_ID: "", R2_SECRET_ACCESS_KEY: "", R2_BUCKET: "", R2_PUBLIC_URL: "", GOOGLE_CLIENT_ID: "", GOOGLE_CLIENT_SECRET: "", GOOGLE_REFRESH_TOKEN: "", GMAIL_SENDER: "" },
  stdio: "ignore", detached: true,
});
const stop = () => { try { process.kill(-server.pid); } catch {} };
process.on("exit", stop);
const url = (p) => `http://localhost:${PORT}${p}`;
for (let i = 0; i < 60; i++) { try { if ((await fetch(url("/cookies"))).ok) break; } catch {} await new Promise((r) => setTimeout(r, 500)); }

const token = await new SignJWT({ sub: buyer.id }).setProtectedHeader({ alg: "HS256" }).setExpirationTime("1h").sign(new TextEncoder().encode(SECRET));
const pct = (a, p) => a.slice().sort((x, y) => x - y)[Math.min(a.length - 1, Math.floor((p / 100) * a.length))];
const round = (n) => Math.round(n * 10) / 10;

async function timeOne(path, headers = {}) {
  const t0 = performance.now();
  const res = await fetch(url(path), { headers: { "accept-encoding": "gzip", ...headers } });
  const ttfb = performance.now() - t0;
  const buf = Buffer.from(await res.arrayBuffer());
  return { status: res.status, ttfb, total: performance.now() - t0, bytes: buf.length, gz: gzipSync(buf).length };
}
async function measure(name, path, { runs = 25, headers } = {}) {
  for (let i = 0; i < 3; i++) await timeOne(path, headers);
  const r = [];
  for (let i = 0; i < runs; i++) r.push(await timeOne(path, headers));
  const bad = r.filter((x) => x.status !== 200).length;
  return { name, path, status: r[0].status, errors: bad, ttfbP50: round(pct(r.map((x) => x.ttfb), 50)), ttfbP95: round(pct(r.map((x) => x.ttfb), 95)), totalP50: round(pct(r.map((x) => x.total), 50)), htmlKB: round(r[0].bytes / 1024), gzipKB: round(r[0].gz / 1024) };
}
const s = sample;
const pages = [
  ["Home", "/"], ["Browse (no filter)", "/listings"], ["Browse (brand + city)", "/listings?brand=Honda&city=Pokhara"],
  ["Browse (text search)", "/listings?q=pulsar"], ["Browse (page 5, price sort)", "/listings?page=5&sort=price_asc"],
  ["Listing detail", `/listings/${s[0].id}`], ["Seller profile", `/sellers/${s[0].sellerId}`],
  ["Compare (3 bikes)", `/compare?ids=${s.map((x) => x.id).join(",")}`],
];
const results = [];
for (const [name, path] of pages) results.push(await measure(name, path));
results.push(await measure("Home (logged in)", "/", { headers: { cookie: `session=${token}` } }));
results.push(await measure("Inbox (logged in)", "/inbox", { headers: { cookie: `session=${token}` } }));

// throughput under concurrency
async function load(path, conc = 10, total = 200) {
  let done = 0; const lat = []; const t0 = performance.now();
  await Promise.all(Array.from({ length: conc }, async () => { while (done < total) { done++; const t = performance.now(); const r = await fetch(url(path)); await r.arrayBuffer(); lat.push(performance.now() - t); } }));
  const secs = (performance.now() - t0) / 1000;
  return { path, concurrency: conc, requests: lat.length, rps: round(lat.length / secs), p95: round(pct(lat, 95)) };
}
const throughput = [await load("/"), await load("/listings"), await load(`/listings/${s[0].id}`)];

// image delivery: optimizer cold vs warm, and bytes versus the original file
const img = photos[0];
const orig = await fetch(url(img));
const origBytes = (await orig.arrayBuffer()).byteLength;
const q = `/_next/image?url=${encodeURIComponent(img)}&w=750&q=75`;
const cold = await timeOne(q, { accept: "image/avif,image/webp,*/*" });
const warm = await timeOne(q, { accept: "image/avif,image/webp,*/*" });
const imgRes = await fetch(url(q), { headers: { accept: "image/avif,image/webp,*/*" } });
const images = { originalKB: round(origBytes / 1024), optimizedKB: round(warm.bytes / 1024), coldMs: round(cold.total), warmMs: round(warm.total), cacheControl: imgRes.headers.get("cache-control") };

// real browser: LCP, layout shift, bytes and requests on a cold cache
const browser = await chromium.launch();
async function browserMetrics(path, runs = 5) {
  const rows = [];
  for (let i = 0; i < runs + 1; i++) {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await ctx.newPage();
    await page.addInitScript(() => {
      window.__lcp = 0; window.__cls = 0;
      new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__lcp = e.startTime; }).observe({ type: "largest-contentful-paint", buffered: true });
      new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; }).observe({ type: "layout-shift", buffered: true });
    });
    await page.goto(url(path), { waitUntil: "load" });
    await page.waitForTimeout(400);
    const m = await page.evaluate(() => {
      const nav = performance.getEntriesByType("navigation")[0];
      const res = performance.getEntriesByType("resource");
      return { lcp: window.__lcp, cls: window.__cls, load: nav.loadEventEnd, requests: res.length + 1, kb: (nav.transferSize + res.reduce((a, r) => a + r.transferSize, 0)) / 1024, js: res.filter((r) => r.name.endsWith(".js")).length };
    });
    if (i > 0) rows.push(m); // first run warms the image optimizer cache
    await ctx.close();
  }
  const med = (k) => round(pct(rows.map((r) => r[k]), 50));
  return { path, lcp: med("lcp"), cls: Math.round(pct(rows.map((r) => r.cls), 50) * 1000) / 1000, load: med("load"), requests: med("requests"), kb: med("kb") };
}
const browserResults = [];
for (const [name, path] of [["Home", "/"], ["Browse", "/listings"], ["Listing detail", `/listings/${s[0].id}`]]) browserResults.push({ name, ...(await browserMetrics(path)) });
await browser.close();

mkdirSync("perf-results", { recursive: true });
const out = { label, at: new Date().toISOString(), listings: N_LISTINGS, results, throughput, images, browser: browserResults };
writeFileSync(`perf-results/perf-${label}.json`, JSON.stringify(out, null, 2));
console.table(results.map((r) => ({ page: r.name, ttfbP50: r.ttfbP50, ttfbP95: r.ttfbP95, htmlKB: r.htmlKB, gzipKB: r.gzipKB, errors: r.errors })));
console.table(throughput); console.log(images); console.table(browserResults);
stop();
