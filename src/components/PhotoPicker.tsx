"use client";

import { useEffect, useRef, useState } from "react";
import { MAX_IMAGE_BYTES } from "@/lib/constants";
import { Icon } from "./Icon";

const TYPES = ["image/jpeg", "image/png", "image/webp"];

type Picked = { file: File; url: string };

/**
 * Photo field for the sell form: a drop zone you can click or drag photos onto, with thumbnails you can remove.
 * The real <input name="images"> stays in the form and is kept in sync, so the server action receives the files
 * as before. `room` is how many new photos fit (the limit minus photos the ad already has and keeps).
 */
export function PhotoPicker({ room, hasCover }: { room: number; hasCover: boolean }) {
  const input = useRef<HTMLInputElement>(null);
  const [picked, setPicked] = useState<Picked[]>([]);
  const [note, setNote] = useState("");
  const [over, setOver] = useState(false);

  // previews are freed when removed, and the rest when the form goes away
  const live = useRef<Picked[]>([]);
  useEffect(() => () => live.current.forEach((p) => URL.revokeObjectURL(p.url)), []);

  // the input's file list always mirrors the thumbnails
  useEffect(() => {
    live.current = picked;
    if (!input.current) return;
    const dt = new DataTransfer();
    picked.forEach((p) => dt.items.add(p.file));
    input.current.files = dt.files;
  }, [picked]);
  function add(files: FileList | null) {
    if (!files) return;
    const skipped: string[] = [];
    const next = [...picked];
    for (const f of Array.from(files)) {
      if (!TYPES.includes(f.type)) { skipped.push(`${f.name} is not a JPG, PNG or WebP`); continue; }
      if (f.size > MAX_IMAGE_BYTES) { skipped.push(`${f.name} is over 5 MB`); continue; }
      if (next.some((p) => p.file.name === f.name && p.file.size === f.size)) continue;
      if (next.length >= room) { skipped.push(`only ${room} more ${room === 1 ? "photo fits" : "photos fit"}`); break; }
      next.push({ file: f, url: URL.createObjectURL(f) });
    }
    setNote(skipped.length ? `Skipped: ${skipped.join("; ")}.` : "");
    setPicked(next); // always a new array, so the input is re-synced even when nothing was added
  }

  function remove(i: number) {
    URL.revokeObjectURL(picked[i].url);
    setPicked((ps) => ps.filter((_, j) => j !== i));
    setNote("");
  }

  const full = picked.length >= room;
  return (
    <div>
      {/* kept in the form for submission; the visible control is the drop zone */}
      <input
        ref={input} type="file" name="images" accept={TYPES.join(",")} multiple tabIndex={-1} aria-hidden
        className="sr-only" onChange={(e) => add(e.target.files)}
      />
      {!full && (
        <button
          type="button"
          onClick={() => input.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setOver(true); }}
          onDragLeave={() => setOver(false)}
          onDrop={(e) => { e.preventDefault(); setOver(false); add(e.dataTransfer.files); }}
          className={`flex w-full flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed px-4 py-8 text-center transition-colors ${over ? "border-brand bg-brand/5" : "border-field/60 bg-wash hover:border-field"}`}
        >
          <Icon name="plus" className="size-6 text-muted" />
          <span className="font-medium text-ink">{picked.length ? "Add more photos" : "Add photos"}</span>
          <span className="text-sm text-muted">Click to choose, or drag them here. JPG, PNG or WebP, up to 5 MB each.</span>
        </button>
      )}
      {note && <p role="status" className="mt-2 text-sm text-warn">{note}</p>}
      {picked.length > 0 && (
        <ul className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-4">
          {picked.map((p, i) => (
            <li key={p.url} className="relative overflow-hidden rounded-md border border-line bg-card">
              {/* eslint-disable-next-line @next/next/no-img-element -- local previews (blob: URLs) */}
              <img src={p.url} alt={`New photo ${i + 1}`} className="aspect-square w-full object-cover" />
              {i === 0 && !hasCover && <span className="absolute left-1.5 top-1.5 rounded bg-dark px-1.5 py-0.5 text-[11px] font-medium text-on-dark">Cover</span>}
              <button
                type="button" onClick={() => remove(i)} aria-label={`Remove new photo ${i + 1}`}
                className="absolute right-1.5 top-1.5 grid size-7 place-items-center rounded-full bg-raised/90 text-ink shadow-sm hover:bg-raised"
              >
                <Icon name="close" className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-2 text-sm text-muted">{picked.length} of {room} new {room === 1 ? "photo" : "photos"} added</p>
    </div>
  );
}
