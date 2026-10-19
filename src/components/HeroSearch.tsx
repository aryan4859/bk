"use client";

import { useState } from "react";
import { type BikeType, CATALOG, type Listed, brandsFor, modelGroups } from "@/lib/catalog";
import { CITIES } from "@/lib/constants";
import { Icon } from "./Icon";

const TYPES = [["", "All vehicles"], ["MOTORCYCLE", "Motorcycles"], ["SCOOTER", "Scooters"]] as const;

/**
 * The home page search: one row of dropdowns, a plain GET form to /listings so it works without script.
 * With script the type narrows the brands and models (motorcycles and scooters have their own lists), the model
 * list follows the brand, and empty fields are left out of the results address.
 */
export function HeroSearch({ listed }: { listed: Listed[] }) {
  const [type, setType] = useState<BikeType | "">("");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const brands = brandsFor(type, listed);
  const groups = modelGroups(type, brand, listed);
  const noun = type === "SCOOTER" ? "scooter" : type === "MOTORCYCLE" ? "motorcycle" : "model";
  // brands whose range we haven't catalogued yet: say "any", not "none"
  const unknownRange = brand in CATALOG && Object.values(CATALOG[brand as keyof typeof CATALOG]).every((m) => m.length === 0);

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
      onSubmit={(e) => { for (const el of e.currentTarget.querySelectorAll("select")) if (!el.value) el.disabled = true; }}
      className="grid gap-2 p-3 sm:grid-cols-2 sm:p-4 lg:grid-cols-[repeat(4,minmax(0,1fr))_auto] lg:gap-0 lg:p-3"
    >
      <Field id="hs-type" label="Vehicle type" icon="bike">
        <select id="hs-type" name="type" value={type} onChange={(e) => pickType(e.target.value as BikeType | "")} className={SELECT}>
          {TYPES.map(([value, label]) => <option key={label} value={value}>{label}</option>)}
        </select>
      </Field>
      <Field id="hs-brand" label="Brand" icon="tag">
        <select id="hs-brand" name="brand" value={brand} onChange={(e) => { setBrand(e.target.value); setModel(""); }} className={SELECT}>
          <option value="">Brand</option>
          {brands.map((b) => <option key={b}>{b}</option>)}
        </select>
      </Field>
      <Field id="hs-model" label="Model" icon="layers">
        <select id="hs-model" name="model" value={model} onChange={(e) => setModel(e.target.value)} className={SELECT}>
          <option value="">{groups.length || unknownRange || !brand ? "Model" : `No ${noun}s from ${brand}`}</option>
          {groups.map((g) => (
            <optgroup key={g.label} label={g.label}>
              {g.models.map((m) => (
                <option key={`${g.label}-${m.name}`} value={m.name}>{m.n ? `${m.name} (${m.n} for sale)` : m.name}</option>
              ))}
            </optgroup>
          ))}
        </select>
      </Field>
      <Field id="hs-city" label="Location" icon="pin">
        <select id="hs-city" name="city" defaultValue="" className={SELECT}>
          <option value="">Location</option>
          {CITIES.map((c) => <option key={c}>{c}</option>)}
        </select>
      </Field>
      <button className="btn-primary !min-h-11 w-full sm:col-span-2 lg:col-span-1 lg:ml-3 lg:w-auto lg:px-8">
        <Icon name="search" className="size-4" />
        Search
      </button>
    </form>
  );
}

const SELECT = "h-11 w-full cursor-pointer appearance-none truncate rounded-md border border-line bg-raised pl-10 pr-9 text-sm text-ink outline-none transition-colors hover:border-field focus:border-brand focus:ring-[3px] focus:ring-brand/15 lg:rounded-none lg:border-0 lg:border-r lg:focus:ring-inset";

/** One dropdown with an icon in front and a chevron behind; the label is for screen readers, the first option shows the field's name. */
function Field({ id, label, icon, children }: { id: string; label: string; icon: "bike" | "tag" | "layers" | "pin"; children: React.ReactNode }) {
  return (
    <div className="relative">
      <label htmlFor={id} className="sr-only">{label}</label>
      <Icon name={icon} className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" />
      {children}
      <Icon name="chevron" className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
    </div>
  );
}
