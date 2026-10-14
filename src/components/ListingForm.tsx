"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { BRANDS, CITIES, MAX_IMAGES } from "@/lib/constants";
import type { FormState } from "@/lib/actions";

type Initial = {
  type: string; brand: string; model: string; year: number; kmDriven: number; ownerCount: number;
  priceNpr: number; negotiable: boolean; city: string; phone: string; bluebookOk: boolean;
  title: string; description: string;
};

type Props = {
  action: (prev: FormState, fd: FormData) => Promise<FormState>;
  initial?: Initial;
  images?: { id: string; url: string }[];
  submitLabel: string;
};

export function ListingForm({ action, initial, images = [], submitLabel }: Props) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const [previews, setPreviews] = useState<string[]>([]);
  const fe = state?.fieldErrors ?? {};
  const err = (k: string) => fe[k] && <p className="mt-1 text-sm text-brand">{fe[k]}</p>;
  const year = new Date().getFullYear();
  // after a failed submit React resets the form, so re-seed it from what the server echoed back
  const v = (k: keyof Initial, fallback: string | number | undefined) => String(state?.values?.[k] ?? fallback ?? "");
  const checked = (k: "negotiable" | "bluebookOk", fallback: boolean) => (state?.values ? state.values[k] === "on" : fallback);

  return (
    <form key={state?.values ? JSON.stringify(state.values) : "fresh"} action={formAction} className="space-y-8">
      {state?.error && <div role="alert" className="rounded-md border border-brand/30 bg-brand/5 px-4 py-3 text-sm text-brand">{state.error}{state.fieldErrors && " Your photos need to be chosen again."}</div>}

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
        <input
          type="file" name="images" accept="image/jpeg,image/png,image/webp" multiple
          onChange={(e) => setPreviews(Array.from(e.target.files ?? []).map((f) => URL.createObjectURL(f)))}
          aria-label="Choose photos" className="block w-full text-sm file:mr-3 file:rounded-md file:border file:border-line file:bg-surface file:px-3 file:py-2 file:text-sm hover:file:border-ink"
        />
        {previews.length > 0 && (
          <div className="grid grid-cols-4 gap-3 sm:grid-cols-6">
            {previews.map((p) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={p} src={p} alt="" className="aspect-square w-full rounded-md object-cover" />
            ))}
          </div>
        )}
      </fieldset>

      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="mb-3 text-lg font-semibold">The bike</legend>
        <div>
          <label className="label" htmlFor="type">Type</label>
          <select id="type" name="type" defaultValue={v("type", initial?.type ?? "MOTORCYCLE")} className="input">
            <option value="MOTORCYCLE">Motorcycle</option>
            <option value="SCOOTER">Scooter</option>
          </select>
        </div>
        <div>
          <label className="label" htmlFor="brand">Brand</label>
          <select id="brand" name="brand" defaultValue={v("brand", initial?.brand)} required className="input">
            <option value="" disabled>Choose…</option>
            {BRANDS.map((b) => <option key={b}>{b}</option>)}
          </select>
          {err("brand")}
        </div>
        <div>
          <label className="label" htmlFor="model">Model</label>
          <input id="model" name="model" defaultValue={v("model", initial?.model)} placeholder="Pulsar NS200" className="input" />
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
        <label className="flex items-center gap-2 text-[15px] sm:col-span-2">
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
          <label className="label" htmlFor="title">Title</label>
          <input id="title" name="title" defaultValue={v("title", initial?.title)} placeholder="Pulsar NS200, single owner, new tyres" className="input" />
          {err("title")}
        </div>
        <div>
          <label className="label" htmlFor="description">Condition and details</label>
          <textarea id="description" name="description" rows={6} defaultValue={v("description", initial?.description)} placeholder="Service history, accidents, modifications, why you are selling…" className="input" />
          {err("description")}
        </div>
      </fieldset>

      <div>
        <label className="flex items-start gap-2 text-[15px]">
          <input type="checkbox" name="confirm" required className="mt-1 size-4 shrink-0 accent-brand" />
          <span>I own this bike or am allowed to sell it, and the details and photos are accurate. I agree to the <Link href="/terms" target="_blank" className="text-brand underline">terms</Link> and <Link href="/privacy" target="_blank" className="text-brand underline">privacy policy</Link>.</span>
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
