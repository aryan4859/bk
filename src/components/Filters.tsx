import Link from "next/link";
import { BRANDS, CITIES, SORTS } from "@/lib/constants";
import type { Filters } from "@/lib/queries";

export function FilterForm({ f }: { f: Filters }) {
  return (
    <form action="/listings" className="space-y-4 text-sm">
      <div>
        <label className="label" htmlFor="q">Search</label>
        <input id="q" name="q" defaultValue={f.q} placeholder="Model, keyword" className="input" />
      </div>
      <div>
        <label className="label" htmlFor="type">Type</label>
        <select id="type" name="type" defaultValue={f.type} className="input">
          <option value="">All</option>
          <option value="MOTORCYCLE">Motorcycles</option>
          <option value="SCOOTER">Scooters</option>
        </select>
      </div>
      <div>
        <label className="label" htmlFor="brand">Brand</label>
        <select id="brand" name="brand" defaultValue={f.brand} className="input">
          <option value="">Any</option>
          {BRANDS.map((b) => <option key={b}>{b}</option>)}
        </select>
      </div>
      <div>
        <label className="label" htmlFor="city">City</label>
        <select id="city" name="city" defaultValue={f.city} className="input">
          <option value="">Anywhere</option>
          {CITIES.map((c) => <option key={c}>{c}</option>)}
        </select>
      </div>
      <div>
        <span className="label">Price (Rs.)</span>
        <div className="flex gap-2">
          <input name="minPrice" inputMode="numeric" defaultValue={f.minPrice} placeholder="Min" className="input" aria-label="Minimum price" />
          <input name="maxPrice" inputMode="numeric" defaultValue={f.maxPrice} placeholder="Max" className="input" aria-label="Maximum price" />
        </div>
      </div>
      <div className="flex gap-2">
        <div>
          <label className="label" htmlFor="minYear">Year from</label>
          <input id="minYear" name="minYear" inputMode="numeric" defaultValue={f.minYear} placeholder="2018" className="input" />
        </div>
        <div>
          <label className="label" htmlFor="maxKm">Max km</label>
          <input id="maxKm" name="maxKm" inputMode="numeric" defaultValue={f.maxKm} placeholder="20000" className="input" />
        </div>
      </div>
      <div>
        <label className="label" htmlFor="sort">Sort by</label>
        <select id="sort" name="sort" defaultValue={f.sort} className="input">
          {Object.entries(SORTS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>
      <div className="flex gap-2 pt-1">
        <button className="btn-primary flex-1">Apply</button>
        <Link href="/listings" className="btn-outline">Reset</Link>
      </div>
    </form>
  );
}
