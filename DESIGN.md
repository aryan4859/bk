# Sawari design

Warm and plain-spoken, like a well-kept noticeboard rather than a startup template. Paper-coloured page,
ink text, one red, a serif with some character, and copy that sounds like a person. Tokens live in
`src/app/globals.css`; components only use the token classes, never raw hex.

## Colour
| Token | Light | Dark | Use |
|---|---|---|---|
| canvas | #f7f4ee | #171513 | the page: paper, never pure white or blue-black |
| raised | #fffdf9 | #1f1c19 | cards and panels, a shade lighter than the page (`bg-surface`) |
| ink | #1d1b18 | #f3efe7 | headings, primary text, links |
| body / muted | #3b3833 / #69635a | #d9d3c8 / #a69f93 | running text / secondary text (AA on canvas and card) |
| line | #e3ddd2 | #332f29 | hairlines: card edges, dividers |
| wash / card / cream | #f1ece3 / #ebe5da / #e2dacb | #1d1a17 / #26231f / #2f2b26 | photo wells, selected tabs, hover fills |
| accent | #b8322a | #e0645a | rhododendron red: the main button, badges, the hand-drawn marks |

Red is scarce on purpose: one button per view, the featured badge, the underline and the sun in the hero.

## Type
- Fraunces (soft, medium weight) for headings; its italic for the odd emphasised word.
- Inter for everything else.
- Cormorant Garamond only for the "Sawari" wordmark (header logo, preloader and footer outlines are cut from it).

## Voice
Write like someone who sells bikes in Kathmandu, not a landing page. Short, specific, a bit warm:
"Bike sitting in the gully?", "You agree on a price over tea". Say what we don't do (we don't inspect bikes).
No hype words, no "seamless", no "unlock".

## Things we don't do
These read as generated: neon on black, glow blobs, dot grids, cycling headline words, sparkle tickers,
pulsing "live" pills, giant outlined marquee text, "01 / 02 / 03" step numbers. Keep it to the content.

## Surfaces and shape
- Depth from tone (cards lighter than the page) plus a hairline, not shadow. `shadow-pop` only for things
  that float: the hero search, menus, toasts, dialogs.
- Sections are separated by a top hairline and 64-80px of padding.
- Radius: 8px buttons and inputs, 12px cards, 16px large panels.
- One hand-made mark per page at most: the pen-stroke underline in the hero headline.
