import { describe, expect, it } from "vitest";
import { COMPARE_MAX, compareRows, parseCompareIds } from "@/lib/compare";

const bike = (o: Partial<Parameters<typeof compareRows>[0][number]> = {}) => ({
  type: "MOTORCYCLE" as const, brand: "Honda", model: "Shine", year: 2020, kmDriven: 10000, ownerCount: 1,
  priceNpr: 200000, negotiable: true, bluebookOk: true, city: "Pokhara", ...o,
});
const row = (rows: ReturnType<typeof compareRows>, label: string) => rows.find((r) => r.label === label)!;

describe("parseCompareIds", () => {
  it("handles missing input", () => {
    expect(parseCompareIds(undefined)).toEqual([]);
    expect(parseCompareIds("")).toEqual([]);
  });
  it("splits, dedupes and caps the list", () => {
    const ids = ["cma1111111111", "cma2222222222", "cma3333333333", "cma4444444444"];
    expect(parseCompareIds(ids.join(","))).toEqual(ids.slice(0, COMPARE_MAX));
    expect(parseCompareIds("cma1111111111,cma1111111111")).toEqual(["cma1111111111"]);
  });
  it("rejects anything that does not look like an id", () => {
    expect(parseCompareIds("../../etc/passwd,<script>,short,cma1111111111")).toEqual(["cma1111111111"]);
  });
  it("uses the first value of a repeated param", () => {
    expect(parseCompareIds(["cma1111111111", "cma2222222222"])).toEqual(["cma1111111111"]);
  });
});

describe("compareRows", () => {
  it("marks the cheapest, newest and lowest-mileage bike as best", () => {
    const rows = compareRows([bike({ priceNpr: 250000, year: 2018, kmDriven: 5000 }), bike({ priceNpr: 200000, year: 2021, kmDriven: 9000 })]);
    expect(row(rows, "Price").best).toEqual([1]);
    expect(row(rows, "Year").best).toEqual([1]);
    expect(row(rows, "Driven").best).toEqual([0]);
  });
  it("marks ties together and nothing when all values are equal", () => {
    const rows = compareRows([bike({ priceNpr: 100000 }), bike({ priceNpr: 100000 }), bike({ priceNpr: 300000 })]);
    expect(row(rows, "Price").best).toEqual([0, 1]);
    expect(row(compareRows([bike(), bike()]), "Price").best).toEqual([]);
  });
  it("formats values", () => {
    const rows = compareRows([bike({ negotiable: false, bluebookOk: false, type: "SCOOTER" }), bike()]);
    expect(row(rows, "Negotiable").values).toEqual(["Fixed price", "Yes"]);
    expect(row(rows, "Bluebook").values).toEqual(["Not stated", "Seller says up to date"]);
    expect(row(rows, "Type").values).toEqual(["Scooter", "Motorcycle"]);
    expect(row(rows, "Price").values[0]).toBe("Rs. 2,00,000");
  });
});
