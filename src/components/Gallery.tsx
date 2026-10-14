"use client";

import { useState } from "react";

export function Gallery({ images, alt }: { images: string[]; alt: string }) {
  const [i, setI] = useState(0);
  if (images.length === 0) return <div className="aspect-[4/3] rounded-lg bg-wash" />;
  return (
    <div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={images[i]} alt={alt} className="aspect-[4/3] w-full rounded-lg border border-line bg-wash object-cover" />
      {images.length > 1 && (
        <div className="mt-3 grid grid-cols-5 gap-2 sm:grid-cols-6">
          {images.map((src, n) => (
            <button key={src} onClick={() => setI(n)} aria-label={`Photo ${n + 1}`} className={`overflow-hidden rounded-md border-2 ${n === i ? "border-ink" : "border-transparent"}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="aspect-square w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
