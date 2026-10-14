import Image from "next/image";

export function Photo({ src, alt, className = "" }: { src?: string; alt: string; className?: string }) {
  if (!src) return <div className={`bg-wash ${className}`} />;
  return <Image src={src} alt={alt} fill unoptimized sizes="(min-width: 1024px) 25vw, 50vw" className={`object-cover ${className}`} />;
}
