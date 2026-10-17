"use client";

import { useState } from "react";
import { type BikeType, type Listed, brandsFor, modelGroups } from "@/lib/catalog";
import { BUDGETS } from "@/lib/constants";

const TYPES = [["", "All bikes"], ["MOTORCYCLE", "Motorcycles"], ["SCOOTER", "Scooters"]] as const;
const THIS_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 14 }, (_, i) => THIS_YEAR - 1 - i);

/**
 * The home page search: a plain GET form to /listings, so it works without script. With script the type tabs
 * narrow the brands and models (motorcycles and scooters have their own lists), the model list follows the
 * brand, and empty fields are left out of the results address.
 */
export function HeroSearch({ listed }: { listed: Listed[] }) {
  const [type, setType] = useState<BikeType | "">("");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const brands = brandsFor(type, listed);
  const groups = modelGroups(type, brand, listed);
  const noun = type === "SCOOTER" ? "scooter" : type === "MOTORCYCLE" ? "motorcycle" : "model";

  // switching type keeps the brand and model only if they still exist for it
  function pickType(next: BikeType | "") {
    setType(next);
    const nextBrands = brandsFor(next, listed);
    const keepBrand = brand && nextBrands.includes(brand as never) ? brand : "";
    if (!keepBrand) setBrand("");
    if (model && !modelGroups(next, keepBrand, listed).some((g) => g.models.some((m) => m.name === model))) setModel("");
  }

  return (
    <form
      action="/listings"
      onSubmit={(e) => { for (const el of e.currentTarget.querySelectorAll<HTMLInputElement | HTMLSelectElement>("select, input:checked")) if (!el.value) el.disabled = true; }}
      className="rounded-2xl bg-surface p-4 shadow-pop sm:p-5"
    >
      <fieldset>
        <legend className="sr-only">Type of bike</legend>
        <div className="grid grid-cols-3 gap-1 rounded-xl bg-card p-1">
          {TYPES.map(([value, label]) => (
            <label key={label} className="cursor-pointer">
              <input type="radio" name="type" value={value} checked={type === value} onChange={() => pickType(value)} className="peer sr-only" />
              <span className="flex min-h-10 items-center justify-center rounded-lg px-2 text-sm font-medium text-muted transition-colors peer-checked:bg-canvas peer-checked:text-ink peer-checked:shadow-sm peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ink">{label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="hs-brand" className="label">Brand</label>
          <select id="hs-brand" name="brand" value={brand} onChange={(e) => { setBrand(e.target.value); setModel(""); }} className="input">
            <option value="">Any brand</option>
            {brands.map((b) => <option key={b}>{b}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="hs-model" className="label">Model</label>
          <select id="hs-model" name="model" value={model} onChange={(e) => setModel(e.target.value)} className="input">
            <option value="">{groups.length ? `Any ${noun}` : `No ${noun}s from ${brand}`}</option>
            {groups.map((g) => (
              <optgroup key={g.label} label={g.label}>
                {g.models.map((m) => (
                  <option key={`${g.label}-${m.name}`} value={m.name}>{m.n ? `${m.name} (${m.n} for sale)` : m.name}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="hs-year" className="label">Year</label>
          <select id="hs-year" name="minYear" defaultValue="" className="input">
            <option value="">Any year</option>
            {YEARS.map((y) => <option key={y} value={y}>{y} or newer</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="hs-budget" className="label">Budget</label>
          <select id="hs-budget" name="budget" defaultValue="" className="input">
            <option value="">Any budget</option>
            {BUDGETS.map((b) => <option key={b.key} value={b.key}>{b.label}</option>)}
          </select>
        </div>
      </div>
      <button className="btn-primary mt-4 w-full">Search {type === "SCOOTER" ? "scooters" : type === "MOTORCYCLE" ? "motorcycles" : "bikes"}</button>
    </form>
  );
}
