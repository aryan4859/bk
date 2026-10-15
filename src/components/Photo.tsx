import { SafeImage } from "./SafeImage";

export function Photo({ src, alt, className = "", sizes = "(min-width: 1024px) 25vw, 50vw", priority = false }: { src?: string; alt: string; className?: string; sizes?: string; priority?: boolean }) {
  if (!src) return <div className={`bg-card ${className}`} />;
  return (
    <span className="absolute inset-0 block overflow-hidden">
      <SafeImage src={src} alt={alt} fill sizes={sizes} priority={priority} className={`object-cover ${className}`} />
    </span>
  );
}
