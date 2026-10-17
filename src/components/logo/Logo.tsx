import { EMBLEM, LETTERING } from "./logo-paths";

/** The palace emblem. White in the original artwork, so it takes the text colour here; the finial stays gold. */
export function Emblem({ className = "", draw = false, ...rest }: React.SVGProps<SVGSVGElement> & { draw?: boolean }) {
  return (
    <svg viewBox={EMBLEM.viewBox} className={`logo-art ${className}`} aria-hidden focusable="false" {...rest}>
      {EMBLEM.shapes.map((s, i) => (
        <path key={i} d={s.d} fillRule={s.evenodd ? "evenodd" : undefined} className={s.gold ? "text-gold" : undefined}
          {...(draw ? { pathLength: 1, style: { "--i": i } as React.CSSProperties } : {})} />
      ))}
    </svg>
  );
}

/** "SETO DURBAR" as outlines from the logo artwork, so it matches the emblem exactly. */
export function Lettering({ className = "", draw = false, offset = 0, ...rest }: React.SVGProps<SVGSVGElement> & { draw?: boolean; offset?: number }) {
  return (
    <svg viewBox={LETTERING.viewBox} className={`logo-art ${className}`} aria-hidden focusable="false" {...rest}>
      {LETTERING.paths.map((d, i) => (
        <path key={i} d={d} {...(draw ? { pathLength: 1, style: { "--i": offset + i } as React.CSSProperties } : {})} />
      ))}
    </svg>
  );
}

/** Emblem and lettering side by side, for the header and footer. The preloader lands on the parts marked data-logo-*. */
export function Logo({ size = "md" }: { size?: "sm" | "md" }) {
  const target = size === "md"; // only the header logo is where the preloader lands
  return (
    <span data-logo={target || undefined} className="flex items-center gap-2 text-ink sm:gap-2.5">
      <Emblem data-logo-mark={target || undefined} className={target ? "h-8 w-auto sm:h-9" : "h-7 w-auto"} />
      <Lettering data-logo-text={target || undefined} className={target ? "h-[10px] w-auto sm:h-[13px]" : "h-[10px] w-auto"} />
    </span>
  );
}
