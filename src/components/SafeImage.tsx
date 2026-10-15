"use client";

import Image, { type ImageProps } from "next/image";
import { useState } from "react";

/**
 * next/image that degrades to a plain tile when the file is gone (for example photos that were on a
 * server disk that has since been wiped), instead of a broken image. Use inside a positioned box.
 */
export function SafeImage({ alt, onError, ...props }: ImageProps) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <span role="img" aria-label={alt ? `${alt}: photo unavailable` : "Photo unavailable"} className="absolute inset-0 flex items-center justify-center bg-card p-2 text-center text-xs text-muted">
        <span aria-hidden>Photo unavailable</span>
      </span>
    );
  }
  return <Image alt={alt} {...props} onError={(e) => { setFailed(true); onError?.(e); }} />;
}
