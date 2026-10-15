"use client";

import { useState } from "react";
import { BRANDS, BUDGETS } from "@/lib/constants";

const TYPES = [["", "All bikes"], ["MOTORCYCLE", "Motorcycles"], ["SCOOTER", "Scooters"]] as const;
const THIS_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 14 }, (_, i) => THIS_YEAR - 1 - i);

/**
 * The home page search: a plain GET form to /listings, so it works without script. With script the model
 * list follows the chosen brand and empty fields are left out of the results address.
 */
export function HeroSearch({ modelsByBrand }: { modelsByBrand: Record<string, string[]> }) {
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const brands = BRANDS.filter((b) => b !== "Other");
  const groups = brand ? [[brand, modelsByBrand[brand] ?? []] as const] : brands.map((b) => [b, modelsByBrand[b] ?? []] as const).filter(([, m]) => m.length);

  return (
    <form
      action="/listings"
      onSubmit={(e) => { for (const el of e.currentTarget.querySelectorAll<HTMLInputElement | HTMLSelectElement>("select, input:checked")) if (!el.value) el.disabled = true; }}
      className="rounded-2xl bg-surface p-4 sm:p-5"
    >
      <fieldset>
        <legend className="sr-only">Type of bike</legend>
        <div className="grid grid-cols-3 gap-1 rounded-xl bg-canvas p-1">
          {TYPES.map(([value, label]) => (
            <label key={label} className="cursor-pointer">
              <input type="radio" name="type" value={value} defaultChecked={value === ""} className="peer sr-only" />
              <span className="flex min-h-10 items-center justify-center rounded-lg px-2 text-sm font-medium text-muted transition-colors peer-checked:bg-ink peer-checked:text-canvas peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ink">{label}</span>
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
            <option value="">{brand && !(modelsByBrand[brand]?.length) ? "None listed yet" : "Any model"}</option>
            {groups.map(([b, models]) => (
              <optgroup key={b} label={b}>
                {models.map((m) => <option key={`${b}-${m}`} value={m}>{m}</option>)}
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
      <button className="btn-primary mt-4 w-full">Search bikes</button>
    </form>
  );
}
