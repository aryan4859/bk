"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { type BikeType, CATALOG } from "@/lib/catalog";
import { BRANDS, CITIES, CONDITIONS, MAX_IMAGES } from "@/lib/constants";
import type { FormState } from "@/lib/actions";
import { PhotoPicker } from "./PhotoPicker";

type Initial = {
  type: string; brand: string; model: string; year: number; kmDriven: number; ownerCount: number;
  priceNpr: number; negotiable: boolean; city: string; phone: string; bluebookOk: boolean;
  condition: string | null; lotNumber: number | null;
  description: string;
};

type Props = {
  action: (prev: FormState, fd: FormData) => Promise<FormState>;
  initial?: Initial;
  images?: { id: string; url: string }[];
  submitLabel: string;
};

export function ListingForm({ action, initial, images = [], submitLabel }: Props) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const fe = state?.fieldErrors ?? {};
  const err = (k: string) => fe[k] && <p className="mt-1 text-sm text-error">{fe[k]}</p>;
  const year = new Date().getFullYear();
  // after a failed submit React resets the form, so re-seed it from what the server echoed back
  const v = (k: keyof Initial, fallback: string | number | null | undefined) => String(state?.values?.[k] ?? fallback ?? "");
  // type and brand decide which models the model picker offers
  const [type, setType] = useState(() => v("type", initial?.type ?? "MOTORCYCLE") as BikeType);
  const [brand, setBrand] = useState(() => v("brand", initial?.brand));
  const startModel = { type: v("type", initial?.type ?? "MOTORCYCLE"), brand: v("brand", initial?.brand), model: v("model", initial?.model) };
  const checked = (k: "negotiable" | "bluebookOk", fallback: boolean) => (state?.values ? state.values[k] === "on" : fallback);

  return (
    <form key={state?.values ? JSON.stringify(state.values) : "fresh"} action={formAction} className="space-y-8">
      {state?.error && <div role="alert" className="rounded-lg bg-error/10 px-4 py-3 text-sm text-error">{state.error}{state.fieldErrors && " Your photos need to be chosen again."}</div>}

      <fieldset className="space-y-4">
        <legend className="mb-1 text-lg font-semibold">Photos</legend>
        <p className="text-sm text-muted">Up to {MAX_IMAGES} photos, 5 MB each. The first one is the cover. Front, side, meter and bluebook make a good set.</p>
        {images.length > 0 && (
          <div className="grid grid-cols-4 gap-3 sm:grid-cols-6">
            {images.map((im) => (
              <label key={im.id} className="relative block cursor-pointer">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={im.url} alt="" className="aspect-square w-full rounded-md object-cover" />
                <span className="mt-1 flex items-center gap-1 text-xs text-muted">
                  <input type="checkbox" name="removeImage" value={im.id} /> Remove
                </span>
              </label>
            ))}
          </div>
        )}
        {images.length < MAX_IMAGES
          ? <PhotoPicker room={MAX_IMAGES - images.length} hasCover={images.length > 0} />
          : <p className="text-sm text-muted">This ad has the most photos it can take. Tick Remove on one to make room for a new one, save, then add it.</p>}
      </fieldset>

      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="mb-3 text-lg font-semibold">The bike</legend>
        <div>
          <label className="label" htmlFor="type">Type</label>
          <select id="type" name="type" value={type} onChange={(e) => setType(e.target.value as BikeType)} className="input">
            <option value="MOTORCYCLE">Motorcycle</option>
            <option value="SCOOTER">Scooter</option>
          </select>
        </div>
        <div>
          <label className="label" htmlFor="brand">Brand</label>
          <select id="brand" name="brand" value={brand} onChange={(e) => setBrand(e.target.value)} required className="input">
            <option value="" disabled>Choose…</option>
            {BRANDS.map((b) => <option key={b}>{b}</option>)}
          </select>
          {err("brand")}
        </div>
        <div>
          {/* a fresh picker per brand and type; the saved model is only pre-selected for the brand and type it belongs to */}
          <ModelField
            key={`${brand}|${type}`}
            brand={brand}
            models={brand in CATALOG ? CATALOG[brand as keyof typeof CATALOG][type] : []}
            initial={brand === startModel.brand && type === startModel.type ? startModel.model : ""}
          />
          {err("model")}
        </div>
        <div>
          <label className="label" htmlFor="year">Year (AD)</label>
          <input id="year" name="year" type="number" min={1990} max={year + 1} defaultValue={v("year", initial?.year ?? year - 3)} className="input" />
          {err("year")}
        </div>
        <div>
          <label className="label" htmlFor="kmDriven">Kilometres driven</label>
          <input id="kmDriven" name="kmDriven" type="number" min={0} defaultValue={v("kmDriven", initial?.kmDriven)} className="input" />
          {err("kmDriven")}
        </div>
        <div>
          <label className="label" htmlFor="ownerCount">Number of owners</label>
          <input id="ownerCount" name="ownerCount" type="number" min={1} max={10} defaultValue={v("ownerCount", initial?.ownerCount ?? 1)} className="input" />
        </div>
        <div>
          <label className="label" htmlFor="lotNumber">Lot number <span className="font-normal text-muted">(optional)</span></label>
          <input id="lotNumber" name="lotNumber" type="number" inputMode="numeric" min={1} max={999} defaultValue={v("lotNumber", initial?.lotNumber)} placeholder="87" aria-describedby="lot-hint" className="input" />
          <p id="lot-hint" className="mt-1 text-xs text-muted">The number between the letters on the plate, like 87 in Ba 87 Pa 1234. Leave blank for embossed plates.</p>
          {err("lotNumber")}
        </div>
        <fieldset className="sm:col-span-2">
          <legend className="label">Condition</legend>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {Object.entries(CONDITIONS).map(([key, c]) => (
              <label key={key} className="cursor-pointer">
                <input type="radio" name="condition" value={key} required defaultChecked={v("condition", initial?.condition) === key} className="peer sr-only" />
                <span className="flex h-full flex-col rounded-md border border-field/60 bg-raised px-3 py-2.5 transition-colors peer-checked:border-brand peer-checked:bg-brand/5 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ink hover:border-field">
                  <span className="text-sm font-semibold text-ink">{c.label}</span>
                  <span className="text-xs text-muted">{c.hint}</span>
                </span>
              </label>
            ))}
          </div>
          {err("condition")}
        </fieldset>
        <label className="flex items-center gap-2 text-base sm:col-span-2">
          <input type="checkbox" name="bluebookOk" defaultChecked={checked("bluebookOk", initial?.bluebookOk ?? false)} /> The bluebook is up to date and I have it with me
        </label>
      </fieldset>

      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="mb-3 text-lg font-semibold">Price and contact</legend>
        <div>
          <label className="label" htmlFor="priceNpr">Asking price (Rs.)</label>
          <input id="priceNpr" name="priceNpr" type="number" min={1000} defaultValue={v("priceNpr", initial?.priceNpr)} className="input" />
          {err("priceNpr")}
          <label className="mt-2 flex items-center gap-2 text-sm">
            <input type="checkbox" name="negotiable" defaultChecked={checked("negotiable", initial?.negotiable ?? true)} /> Price is negotiable
          </label>
        </div>
        <div>
          <label className="label" htmlFor="city">City</label>
          <select id="city" name="city" defaultValue={v("city", initial?.city)} required className="input">
            <option value="" disabled>Choose…</option>
            {CITIES.map((c) => <option key={c}>{c}</option>)}
          </select>
          {err("city")}
        </div>
        <div className="sm:col-span-2">
          <label className="label" htmlFor="phone">Mobile number buyers can call</label>
          <input id="phone" name="phone" inputMode="tel" defaultValue={v("phone", initial?.phone.replace(/^977/, ""))} placeholder="98XXXXXXXX" className="input sm:max-w-xs" />
          {err("phone")}
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="mb-1 text-lg font-semibold">Description</legend>
        <div>
          <label className="label" htmlFor="description">Details</label>
          <textarea id="description" name="description" rows={6} defaultValue={v("description", initial?.description)} placeholder="Service history, accidents, modifications, why you are selling…" className="input" />
          {err("description")}
        </div>
      </fieldset>

      <div>
        <label className="flex items-start gap-2 text-base">
          <input type="checkbox" name="confirm" required className="mt-1 size-4 shrink-0 accent-brand" />
          <span>I own this bike or am allowed to sell it, and the details and photos are accurate. I agree to the <Link href="/terms" target="_blank" className="link">terms</Link> and <Link href="/privacy" target="_blank" className="link">privacy policy</Link>.</span>
        </label>
        {err("confirm")}
        <p className="mt-2 text-sm text-muted">Your mobile number is shown to logged-in users who view your ad. Photos and details are public.</p>
      </div>

      <div className="flex items-center gap-4">
        <button type="submit" disabled={pending} className="btn-primary px-6">{pending ? "Saving…" : submitLabel}</button>
        <span className="text-sm text-muted">New and edited ads are reviewed before they go live.</span>
      </div>
    </form>
  );
}

const OTHER = "__other";

/**
 * The model, picked from the brand's catalogue for the chosen type, with "Other model" for anything missing.
 * Brands we have no models for get a plain text box. Whichever control is showing carries name="model".
 */
function ModelField({ brand, models, initial }: { brand: string; models: readonly string[]; initial: string }) {
  const [choice, setChoice] = useState(initial ? (models.includes(initial) ? initial : OTHER) : "");
  const typed = (
    <input id={models.length ? "model-other" : "model"} name="model" defaultValue={models.includes(initial) ? "" : initial} required
      autoFocus={models.length > 0 && !initial} placeholder="Type the model" className="input" />
  );
  if (!brand) {
    return (
      <>
        <label className="label" htmlFor="model">Model</label>
        <select id="model" disabled className="input"><option>Choose a brand first</option></select>
      </>
    );
  }
  if (models.length === 0) return <><label className="label" htmlFor="model">Model</label>{typed}</>;
  return (
    <>
      <label className="label" htmlFor="model">Model</label>
      <select id="model" name={choice === OTHER ? undefined : "model"} value={choice} onChange={(e) => setChoice(e.target.value)} required className="input">
        <option value="" disabled>Choose…</option>
        {models.map((m) => <option key={m}>{m}</option>)}
        <option value={OTHER}>Other model (type it)</option>
      </select>
      {choice === OTHER && (
        <div className="mt-2">
          <label className="sr-only" htmlFor="model-other">Model name</label>
          {typed}
        </div>
      )}
    </>
  );
}
