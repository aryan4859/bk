import { describe, expect, it } from "vitest";
import { buildWhere, describeFilters, filtersFromQuery, filtersToQuery, parseFilters } from "@/lib/queries";

describe("parseFilters", () => {
  it("applies defaults", () => {
    const f = parseFilters({});
    expect(f).toMatchObject({ q: "", brand: "", city: "", sort: "newest", page: 1 });
  });
  it("drops unknown brands and cities", () => {
    const f = parseFilters({ brand: "Nokia", city: "Atlantis" });
    expect(f.brand).toBe("");
    expect(f.city).toBe("");
  });
  it("keeps valid values, trims and caps the search text", () => {
    const f = parseFilters({ brand: "Honda", city: "Pokhara", q: `  ${"x".repeat(200)} ` });
    expect(f.brand).toBe("Honda");
    expect(f.city).toBe("Pokhara");
    expect(f.q).toHaveLength(80);
  });
  it("uses the first value of repeated params and clamps the page", () => {
    expect(parseFilters({ brand: ["Honda", "KTM"] }).brand).toBe("Honda");
    expect(parseFilters({ page: "-3" }).page).toBe(1);
    expect(parseFilters({ page: "abc" }).page).toBe(1);
    expect(parseFilters({ page: "4" }).page).toBe(4);
  });
});

describe("buildWhere", () => {
  it("always restricts to live ads", () => {
    expect(buildWhere(parseFilters({}))).toEqual({ status: "ACTIVE" });
  });
  it("maps every filter", () => {
    const w = buildWhere(parseFilters({ type: "SCOOTER", brand: "Honda", city: "Pokhara", minPrice: "100000", maxPrice: "300000", minYear: "2018", maxKm: "20000" }));
    expect(w).toMatchObject({
      status: "ACTIVE", type: "SCOOTER", brand: "Honda", city: "Pokhara",
      priceNpr: { gte: 100000, lte: 300000 }, year: { gte: 2018 }, kmDriven: { lte: 20000 },
    });
  });
  it("ignores non-numeric and invalid-type input instead of passing it to the database", () => {
    const w = buildWhere(parseFilters({ type: "TRUCK", minPrice: "abc", maxPrice: "1e9; DROP", minYear: "-1", maxKm: "x" }));
    expect(w).toEqual({ status: "ACTIVE" });
  });
  it("searches title, model, brand and description case-insensitively", () => {
    const w = buildWhere(parseFilters({ q: "pulsar" }));
    expect(w.OR).toHaveLength(4);
    expect(w.OR).toContainEqual({ model: { contains: "pulsar", mode: "insensitive" } });
  });
  it("accepts a max-km of zero", () => {
    expect(buildWhere(parseFilters({ maxKm: "0" })).kmDriven).toEqual({ lte: 0 });
  });
});

describe("budget and model filters", () => {
  it("turns a budget band into a price range", () => {
    expect(parseFilters({ budget: "1l-2l" })).toMatchObject({ minPrice: "100000", maxPrice: "199999" });
    expect(parseFilters({ budget: "under-1l" })).toMatchObject({ minPrice: "", maxPrice: "99999" });
    expect(parseFilters({ budget: "over-5l" })).toMatchObject({ minPrice: "500000", maxPrice: "" });
  });
  it("ignores unknown bands and lets explicit prices win", () => {
    expect(parseFilters({ budget: "free" })).toMatchObject({ minPrice: "", maxPrice: "" });
    expect(parseFilters({ budget: "1l-2l", maxPrice: "150000" })).toMatchObject({ minPrice: "100000", maxPrice: "150000" });
  });
  it("bands never overlap, so a bike counts in exactly one", () => {
    const w = (b: string) => buildWhere(parseFilters({ budget: b })).priceNpr as { gte?: number; lte?: number };
    expect(w("under-1l").lte).toBe(99999);
    expect(w("1l-2l")).toEqual({ gte: 100000, lte: 199999 });
    expect(w("over-5l").gte).toBe(500000);
  });
  it("matches the model loosely and caps its length", () => {
    expect(buildWhere(parseFilters({ model: "pulsar" })).model).toEqual({ contains: "pulsar", mode: "insensitive" });
    expect(parseFilters({ model: "x".repeat(100) }).model).toHaveLength(60);
    expect(filtersToQuery(parseFilters({ brand: "Bajaj", model: "Pulsar NS200", budget: "2l-3l" }))).toBe("brand=Bajaj&model=Pulsar+NS200&minPrice=200000&maxPrice=299999");
  });
});

describe("saved-search query strings", () => {
  it("is empty when no filter is set (sort and page do not count)", () => {
    expect(filtersToQuery(parseFilters({ sort: "price_asc", page: "3" }))).toBe("");
  });
  it("round-trips through parse and is order independent", () => {
    const a = filtersToQuery(parseFilters({ city: "Pokhara", type: "SCOOTER", maxPrice: "300000" }));
    const b = filtersToQuery(parseFilters({ maxPrice: "300000", type: "SCOOTER", city: "Pokhara" }));
    expect(a).toBe(b);
    expect(filtersToQuery(filtersFromQuery(a))).toBe(a);
  });
  it("drops junk so only clean filters are stored", () => {
    expect(filtersToQuery(filtersFromQuery("brand=Nokia&minPrice=abc&type=TRUCK&evil=1"))).toBe("");
    expect(filtersToQuery(filtersFromQuery("brand=Honda&minPrice=abc"))).toBe("brand=Honda");
  });
  it("describes filters for humans", () => {
    expect(describeFilters(parseFilters({}))).toBe("All bikes");
    expect(describeFilters(parseFilters({ type: "SCOOTER", city: "Pokhara", maxPrice: "300000" }))).toBe("Scooter, Pokhara, under Rs. 300000");
  });
});
