import { describe, expect, it } from "vitest";
import { CATALOG, type Listed, brandsFor, modelGroups } from "@/lib/catalog";
import { BRANDS } from "@/lib/constants";

const names = (type: Parameters<typeof modelGroups>[0], brand: string, listed: Listed[] = []) =>
  modelGroups(type, brand, listed).flatMap((g) => g.models.map((m) => m.name));

describe("catalog", () => {
  it("covers every brand except Other, with no model listed twice", () => {
    expect(Object.keys(CATALOG).sort()).toEqual(BRANDS.filter((b) => b !== "Other").sort());
    for (const types of Object.values(CATALOG)) {
      const all = [...types.MOTORCYCLE, ...types.SCOOTER];
      expect(new Set(all).size).toBe(all.length);
    }
  });

  it("offers only brands that make the picked type", () => {
    expect(brandsFor("SCOOTER")).toContain("Vespa");
    expect(brandsFor("SCOOTER")).not.toContain("KTM");
    expect(brandsFor("MOTORCYCLE")).not.toContain("Vespa");
    expect(brandsFor("")).toHaveLength(Object.keys(CATALOG).length);
  });

  it("keeps motorcycles and scooters apart", () => {
    expect(names("SCOOTER", "Honda")).toContain("Activa 6G");
    expect(names("SCOOTER", "Honda")).not.toContain("Shine 125");
    expect(names("MOTORCYCLE", "Honda")).toContain("Shine 125");
    expect(names("MOTORCYCLE", "Honda")).not.toContain("Activa 6G");
    // all types with a brand: one group per type
    expect(modelGroups("", "Honda").map((g) => g.label)).toEqual(["Honda motorcycles", "Honda scooters"]);
    // a type with no brand: grouped by brand
    expect(modelGroups("SCOOTER", "").map((g) => g.label)).toContain("Vespa");
  });

  it("counts live ads, matching names loosely, and adds listed models the catalogue lacks", () => {
    const listed: Listed[] = [
      { brand: "Bajaj", model: "pulsar ns 200", type: "MOTORCYCLE", n: 2 },
      { brand: "Bajaj", model: "Pulsar NS200", type: "MOTORCYCLE", n: 1 },
      { brand: "Bajaj", model: "Boxer 150", type: "MOTORCYCLE", n: 1 },
      { brand: "KTM", model: "Duke 200", type: "SCOOTER", n: 1 }, // mislabelled ad: KTM then shows under scooters
    ];
    const bajaj = modelGroups("MOTORCYCLE", "Bajaj", listed)[0].models;
    expect(bajaj.find((m) => m.name === "Pulsar NS200")?.n).toBe(3);
    expect(bajaj.filter((m) => /pulsar ?ns ?200/i.test(m.name))).toHaveLength(1);
    expect(bajaj.find((m) => m.name === "Boxer 150")?.n).toBe(1);
    expect(bajaj.find((m) => m.name === "Dominar 400")?.n).toBe(0);
    expect(brandsFor("SCOOTER", listed)).toContain("KTM");
  });
});
