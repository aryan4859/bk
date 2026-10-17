import { CONDITIONS, type Condition, TYPE_LABEL } from "./constants";
import { formatKm, formatNpr } from "./format";

export const COMPARE_MAX = 3;

/** Parses "a,b,c" into at most COMPARE_MAX unique, plausible listing ids. */
export function parseCompareIds(raw: string | string[] | undefined): string[] {
  const s = Array.isArray(raw) ? raw[0] : raw;
  if (!s) return [];
  return [...new Set(s.split(",").map((x) => x.trim()).filter((x) => /^[a-z0-9]{10,40}$/i.test(x)))].slice(0, COMPARE_MAX);
}

type CompareListing = {
  type: "MOTORCYCLE" | "SCOOTER"; brand: string; model: string; year: number; kmDriven: number;
  ownerCount: number; priceNpr: number; negotiable: boolean; bluebookOk: boolean; city: string;
  condition?: Condition | null; lotNumber?: number | null;
};

export type CompareRow = { label: string; values: string[]; best?: number[] };

/** Rows for the comparison table. `best` lists the column indexes with the best value (lowest price/km, newest year). */
export function compareRows(ls: CompareListing[]): CompareRow[] {
  const best = (vals: number[], pick: "min" | "max") => {
    if (vals.length < 2) return [];
    const target = pick === "min" ? Math.min(...vals) : Math.max(...vals);
    if (vals.every((v) => v === target)) return [];
    return vals.flatMap((v, i) => (v === target ? [i] : []));
  };
  return [
    { label: "Price", values: ls.map((l) => formatNpr(l.priceNpr)), best: best(ls.map((l) => l.priceNpr), "min") },
    { label: "Negotiable", values: ls.map((l) => (l.negotiable ? "Yes" : "Fixed price")) },
    { label: "Type", values: ls.map((l) => TYPE_LABEL[l.type]) },
    { label: "Year", values: ls.map((l) => String(l.year)), best: best(ls.map((l) => l.year), "max") },
    { label: "Driven", values: ls.map((l) => formatKm(l.kmDriven)), best: best(ls.map((l) => l.kmDriven), "min") },
    { label: "Owners", values: ls.map((l) => String(l.ownerCount)), best: best(ls.map((l) => l.ownerCount), "min") },
    // rows only when at least one ad has the detail (older ads predate these fields)
    ...(ls.some((l) => l.condition) ? [{ label: "Condition", values: ls.map((l) => (l.condition ? CONDITIONS[l.condition].label : "Not stated")) }] : []),
    ...(ls.some((l) => l.lotNumber) ? [{ label: "Lot", values: ls.map((l) => (l.lotNumber ? String(l.lotNumber) : "Not stated")) }] : []),
    { label: "Bluebook", values: ls.map((l) => (l.bluebookOk ? "Seller says up to date" : "Not stated")) },
    { label: "Location", values: ls.map((l) => l.city) },
  ];
}
