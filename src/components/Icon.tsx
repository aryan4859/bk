// Small stroke icons, drawn inline so they take the text colour. Decorative: pair with a text label.
const PATHS = {
  plus: "M12 5v14M5 12h14",
  check: "M5 12.5l4.5 4.5L19 7.5",
  close: "M6 6l12 12M18 6L6 18",
  alert: "M12 7v6M12 16.5v.5",
  chat: "M5 6.5A2.5 2.5 0 017.5 4h9A2.5 2.5 0 0119 6.5v7a2.5 2.5 0 01-2.5 2.5H11l-4 3.5V16h0.5A2.5 2.5 0 015 13.5z",
  bike: "M3 16a3 3 0 106 0 3 3 0 10-6 0M15 16a3 3 0 106 0 3 3 0 10-6 0M6 16l4-7h4l4 7M10 9l-1-3H7M14 9l1.5-2H18",
  send: "M5 12h13M13 6l6 6-6 6",
  sun: "M12 8a4 4 0 100 8 4 4 0 000-8zM12 2.5v2M12 19.5v2M4.6 4.6l1.4 1.4M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4L6 18M18 6l1.4-1.4",
  moon: "M20 14.5A8 8 0 019.5 4a8 8 0 1010.5 10.5z",
} as const;

export function Icon({ name, className = "size-4" }: { name: keyof typeof PATHS; className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d={PATHS[name]} />
    </svg>
  );
}
