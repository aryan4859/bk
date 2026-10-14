import Image from "next/image";

export function Photo({ src, alt, className = "", sizes = "(min-width: 1024px) 25vw, 50vw", priority = false }: { src?: string; alt: string; className?: string; sizes?: string; priority?: boolean }) {
  if (!src) return <div className={`bg-wash ${className}`} />;
  return (
    <span className="img-treated absolute inset-0 block overflow-hidden">
      <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className={`object-cover ${className}`} />
    </span>
  );
}
