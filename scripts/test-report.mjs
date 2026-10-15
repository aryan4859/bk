// Runs every check and writes TEST_REPORT.md (PASS/FAIL for each). Usage: npm run test:report
import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

mkdirSync("test-results", { recursive: true });
const run = (cmd, args) => {
  const t = Date.now();
  const r = spawnSync(cmd, args, { encoding: "utf8", shell: false, maxBuffer: 64 * 1024 * 1024 });
  return { ok: r.status === 0, ms: Date.now() - t, out: `${r.stdout ?? ""}${r.stderr ?? ""}` };
};
const json = (p) => { try { return JSON.parse(readFileSync(p, "utf8")); } catch { return null; } };
const esc = (s) => String(s).replace(/\|/g, "\\|").replace(/\n/g, " ");
const clean = (s) => String(s).replace(/\u001b\[[0-9;]*m/g, "").trim();
const sec = (ms) => (ms / 1000).toFixed(1) + "s";
const icon = (ok) => (ok ? "✅ PASS" : "❌ FAIL");

console.log("1/5 lint");       const lint = run("npx", ["eslint"]);
console.log("2/5 type check"); const tsc = run("npx", ["tsc", "--noEmit", "-p", "tsconfig.test.json"]); // app + tests
console.log("3/5 unit + integration (vitest)");
run("node", ["scripts/test-db.mjs"]);
run("npx", ["vitest", "run", "--reporter=json", "--outputFile=test-results/vitest.json"]);
console.log("4/5 end-to-end (playwright, builds the app)");
run("npx", ["playwright", "test"]);
console.log("5/5 writing report");

// ---- vitest ----
const v = json("test-results/vitest.json");
const vtests = (v?.testResults ?? []).flatMap((f) => f.assertionResults.map((a) => ({
  file: f.name.replace(process.cwd() + "/", ""), name: [...a.ancestorTitles, a.title].join(" › "), ok: a.status === "passed", ms: Math.round(a.duration ?? 0), err: clean(a.failureMessages?.[0] ?? "").split("\n")[0],
})));
const unit = vtests.filter((t) => t.file.startsWith("tests/unit"));
const integ = vtests.filter((t) => t.file.startsWith("tests/integration"));

// ---- playwright ----
const p = json("test-results/playwright.json");
const etests = [];
const walk = (suite, file) => {
  for (const s of suite.specs ?? []) for (const t of s.tests) {
    const r = t.results.at(-1);
    etests.push({ file: s.file ?? file, name: [...(suite.__titles ?? []), s.title].join(" › "), ok: t.status === "expected", skipped: t.status === "skipped", ms: r?.duration ?? 0, err: clean(r?.error?.message ?? "").split("\n")[0] });
  }
  for (const c of suite.suites ?? []) walk({ ...c, __titles: [...(suite.__titles ?? []), c.title].filter((x) => x && !x.endsWith(".spec.ts")) }, file);
};
for (const s of p?.suites ?? []) walk({ ...s, __titles: [] }, s.file);

const group = (tests) => {
  const by = new Map();
  for (const t of tests) by.set(t.file, [...(by.get(t.file) ?? []), t]);
  return [...by].map(([file, ts]) => `<details${ts.some((t) => !t.ok) ? " open" : ""}><summary><code>${file}</code> · ${ts.filter((t) => t.ok).length}/${ts.length} passed</summary>\n\n| Result | Test | Time |\n|---|---|---|\n${ts.map((t) => `| ${t.skipped ? "⏭️ SKIP" : t.ok ? "✅ PASS" : "❌ FAIL"} | ${esc(t.name)}${t.ok ? "" : `<br><sub>${esc(t.err).slice(0, 300)}</sub>`} | ${t.ms} ms |`).join("\n")}\n\n</details>`).join("\n\n");
};
const stat = (ts) => ({ pass: ts.filter((t) => t.ok).length, total: ts.length, ok: ts.length > 0 && ts.every((t) => t.ok) });
const su = stat(unit), si = stat(integ), se = stat(etests);
const rows = [
  ["Lint (ESLint)", lint.ok, "no warnings or errors", lint.ms],
  ["Type check (tsc)", tsc.ok, "no type errors", tsc.ms],
  ["Unit tests", su.ok, `${su.pass}/${su.total}`, unit.reduce((a, t) => a + t.ms, 0)],
  ["Integration tests (real Postgres)", si.ok, `${si.pass}/${si.total}`, integ.reduce((a, t) => a + t.ms, 0)],
  ["End-to-end tests (desktop + phone Chromium, production build)", se.ok, `${se.pass}/${se.total}`, etests.reduce((a, t) => a + t.ms, 0)],
];
const all = rows.every((r) => r[1]);

// ---- performance ----
const before = json("perf-results/perf-before.json"), after = json("perf-results/perf-after.json");
const delta = (a, b) => (a === 0 ? "–" : `${b <= a ? "" : "+"}${Math.round(((b - a) / a) * 100)}%`);
let perf = "";
if (before && after) {
  perf = `## Performance

Production build, ${after.listings.toLocaleString()} synthetic listings in the test database, one local machine, 25 timed requests per page after 3 warm-ups.
${before.note ? `_Note on "before": ${before.note}_\n\n` : ""}TTFB is server response time (lower is better). The app was already fast at this size, so most differences below are within run-to-run noise (about ±1–2 ms).

| Page | TTFB p50 before → after | TTFB p95 before → after | HTML (gzip) before → after |
|---|---|---|---|
${before.results.map((b, i) => { const a = after.results[i]; return `| ${b.name} | ${b.ttfbP50} → ${a.ttfbP50} ms | ${b.ttfbP95} → ${a.ttfbP95} ms | ${b.gzipKB} → ${a.gzipKB} KB (${delta(b.gzipKB, a.gzipKB)}) |`; }).join("\n")}

**Throughput (10 concurrent clients, 200 requests)**

| Page | Requests/s before → after | p95 before → after |
|---|---|---|
${before.throughput.map((b, i) => { const a = after.throughput[i]; return `| ${i === 2 ? "Listing detail" : b.path} | ${b.rps} → ${a.rps} | ${b.p95} → ${a.p95} ms |`; }).join("\n")}

**In the browser (cold cache, Chromium)**

| Page | LCP before → after | Layout shift | Requests | Transferred |
|---|---|---|---|---|
${before.browser.map((b, i) => { const a = after.browser[i]; return `| ${b.name} | ${b.lcp} → ${a.lcp} ms | ${a.cls} | ${a.requests} | ${Math.round(a.kb)} KB |`; }).join("\n")}

Photos: a ${after.images.originalKB} KB original is served as a ${after.images.optimizedKB} KB image at 750 px wide, with a one-year cache header (cold ${after.images.coldMs} ms, then ${after.images.warmMs} ms from cache).

### What was changed for performance

| Change | Why | Measured effect |
|---|---|---|
| Trigram (\`pg_trgm\`) GIN indexes on title, model, brand, description | The text search \`contains\` was a full table scan, run three times per search page | On a 99,000-row scratch table: rare-word search **413 ms → 0.2 ms**, common-word search **367 ms → 12 ms**. At ${after.listings.toLocaleString()} rows Postgres still (correctly) prefers a scan, so the page timing above does not move yet |
| Indexes on \`Listing.sellerId\`, \`Listing(status, featuredUntil)\`, \`(status, type, createdAt)\`, \`Image(listingId, position)\`, \`Favorite.listingId\`, \`Report\` | Missing foreign-key and filter indexes | Not visible at this size; prevents slow joins and deletes as data grows |
| Cards load only the columns they show (no description or phone) | List pages were fetching and serialising 1.5 KB of text per ad they never display | HTML 2–5% smaller on list pages |
| One lookup per request for the logged-in user and for the listing (React \`cache\`) | Layout, page and metadata each queried the same row | Removes 1–2 database round trips per page view (not separately benchmarked) |
| Listing page runs its rating and saved-state queries in parallel | They ran one after the other | One round trip less on the listing page |
| First row of photos preloaded (\`priority\`) | Above-the-fold images were lazy-loaded | Browse LCP ${before.browser[1].lcp} → ${after.browser[1].lcp} ms |
| Fewer image sizes in \`srcset\`, \`poweredByHeader\` off, Devanagari font no longer preloaded | Smaller HTML and fewer image variants to generate | HTML 2–5% smaller; one fewer font preload |
| Home page totals cached for 60 s | The busiest page counted the table on every visit | Already in place for both runs |
`;
}

const failures = [...vtests, ...etests].filter((t) => !t.ok && !t.skipped);
const md = `# Test report

**Overall: ${all ? "✅ PASS" : "❌ FAIL"}** · generated ${new Date().toISOString().replace("T", " ").slice(0, 19)} UTC

| Check | Result | Detail | Time |
|---|---|---|---|
${rows.map((r) => `| ${r[0]} | ${icon(r[1])} | ${r[2]} | ${sec(r[3])} |`).join("\n")}

${failures.length ? `## Failures\n\n${failures.map((t) => `- ❌ **${esc(t.name)}** (\`${t.file}\`): ${esc(t.err)}`).join("\n")}\n` : "No failing tests.\n"}
${lint.ok ? "" : `\n### Lint output\n\n\`\`\`\n${clean(lint.out).slice(0, 2000)}\n\`\`\`\n`}${tsc.ok ? "" : `\n### Type errors\n\n\`\`\`\n${clean(tsc.out).slice(0, 2000)}\n\`\`\`\n`}
## What the tests cover

- **Unit** (no database): price/km/phone/time formatting, filter parsing and the generated database query, saved-search query strings, compare-table logic, review validation, session tokens (tampered, expired, \`alg:none\`), photo upload validation (magic bytes, size, metadata stripping).
- **Integration** (real PostgreSQL test database, server actions called directly): search, pagination and featured-ad pinning/expiry, seller ratings, who may review a seller, price-drop and saved-search emails (no duplicates, skips banned users and the seller), admin-only actions, review and saved-search ownership rules, rate limiting, the email one-time-code login flow including lockout and admin promotion.
- **End-to-end** (Chromium against a production build and the test database): every public page, access control, browsing and filters, compare bikes, seller reviews, saved-search alerts, the admin panel (approve, reject, feature, suspend), posting an ad, chat, and marking sold. A phone-sized run (Pixel 7) checks that no page scrolls sideways, the header fits on one line, tap targets are at least 32 px, and the compare table fits two bikes.

Tests never touch the development database: they use \`motovo_test\`, mail is forced to the console, and \`.env\` is only read.

${perf}
## Unit tests

${group(unit)}

## Integration tests

${group(integ)}

## End-to-end tests

${group(etests)}

---
Re-run everything: \`npm run test:report\`. Individual suites: \`npm test\`, \`npm run test:e2e\`. Performance: \`npm run build && npm run perf -- <label>\`.
`;
writeFileSync("TEST_REPORT.md", md);
console.log(`\n${all ? "PASS" : "FAIL"}: unit ${su.pass}/${su.total}, integration ${si.pass}/${si.total}, e2e ${se.pass}/${se.total}, lint ${lint.ok ? "ok" : "FAIL"}, tsc ${tsc.ok ? "ok" : "FAIL"} -> TEST_REPORT.md`);
process.exit(all ? 0 : 1);
