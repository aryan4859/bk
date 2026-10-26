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
  search: "M11 4a7 7 0 100 14 7 7 0 000-14zM20 20l-4-4",
  pin: "M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0113 0c0 5.4-6.5 11-6.5 11zM12 7.5a2.5 2.5 0 100 5 2.5 2.5 0 000-5z",
  tag: "M3.5 12.5V4.5a1 1 0 011-1h8l8 8-9 9zM8 7.5v.5",
  layers: "M12 4l8 4-8 4-8-4zM4 12l8 4 8-4M4 16l8 4 8-4",
  chevron: "M6 9l6 6 6-6",
  shield: "M12 3l7 3v5.5c0 4.5-3 8-7 9.5-4-1.5-7-5-7-9.5V6zM9 12l2 2 4-4",
  phone: "M5 4.5h3.5l1.5 4-2 1.5a11 11 0 006 6l1.5-2 4 1.5V19a1.5 1.5 0 01-1.5 1.5A15.5 15.5 0 013.5 6 1.5 1.5 0 015 4.5z",
  lock: "M6 11h12v9H6zM8.5 11V8a3.5 3.5 0 017 0v3",
  home: "M4 10.5L12 4l8 6.5V20h-5.5v-6h-5v6H4z",
  heart: "M12 20s-7.5-4.6-7.5-10A4.25 4.25 0 0112 7.4 4.25 4.25 0 0119.5 10c0 5.4-7.5 10-7.5 10z",
  user: "M12 3a9 9 0 100 18 9 9 0 000-18zM12 7.5a3 3 0 100 6 3 3 0 000-6zM6.5 18a6.5 6.5 0 0111 0",
} as const;

export function Icon({ name, className = "size-4" }: { name: keyof typeof PATHS; className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d={PATHS[name]} />
    </svg>
  );
}
