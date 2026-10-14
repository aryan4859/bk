"use client";

import Image from "next/image";
import { useState } from "react";

export function Gallery({ images, alt }: { images: string[]; alt: string }) {
  const [i, setI] = useState(0);
  if (images.length === 0) return <div role="img" aria-label="No photos uploaded" className="aspect-[4/3] rounded-lg bg-surface-sunk" />;
  return (
    <div>
      <div className="relative aspect-[4/3] overflow-hidden rounded-lg border border-line bg-surface-sunk ">
        <Image src={images[i]} alt={`${alt}, photo ${i + 1} of ${images.length}`} fill priority sizes="(min-width: 1024px) 700px, 100vw" className="object-cover" />
      </div>
      {images.length > 1 && (
        <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-6">
          {images.map((src, n) => (
            <button key={src} type="button" onClick={() => setI(n)} aria-label={`Show photo ${n + 1} of ${images.length}`} aria-pressed={n === i} className={`relative aspect-square overflow-hidden rounded-lg border-2 ${n === i ? "border-brand" : "border-transparent"}`}>
              <Image src={src} alt="" fill sizes="120px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
