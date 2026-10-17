# Seto Durbar design

A working classifieds site in the mould of the Nepali car and bike portals people already use: search first,
lots of ads on screen, plain labels. It should look like something a small team built and keeps tidy, not a
showcase. Tokens live in `src/app/globals.css`; components only use the token classes, never raw hex.

## Colour
| Token | Light | Dark | Use |
|---|---|---|---|
| canvas | #f3f4f6 | #111317 | the page, light grey so white cards stand out |
| raised | #ffffff | #1a1d22 | cards, panels, the header and footer |
| ink | #16191f | #eef0f3 | headings, prices, primary text |
| body / muted | #343a44 / #5f6672 | #d3d7dd / #9da4af | running text / secondary text (AA on page and card) |
| line | #dfe2e7 | #2c3139 | card borders, dividers |
| wash / card / cream | #f7f8fa / #e9ebef / #e2e5ea | #16191d / #23272e / #2b3038 | search panel, photo wells, selected tabs |
| brand | #1a56b8 | #7fb0ff | links and "View all" |
| accent | #c8222c | #ef5a5f | the main button, Featured badge, logo mark |

Red is for the one action that matters on a screen (Search, Post an ad, Sell) and the Featured badge.

## Type
- Inter for everything. Headings are semibold, not large: page titles 26-34px, section titles 20-24px.
- Prices are bold and the biggest thing on a card.
- Noto Serif Devanagari only for the assistant's Nepali name.

## Layout
- Header: logo mark and name, Motorcycles / Scooters / Compare, then log in and the red Sell button.
- Home: heading and search in a white band, popular searches from live ads, then Featured, Recently added,
  budget, brands, cities, and a sell banner beside a "Before you pay" checklist.
- Section header: title on the left, a blue "View all ›" link on the right, content 16px below.
- Footer: four columns of links and a copyright row.

## Voice
Plain and specific, like a listing site, not a landing page: "Selling your bike?", "Before you pay",
"Never send an advance to hold a bike". Say what we don't do (we don't inspect bikes). No hype words.

## Things we don't do
Anything that reads as generated: preloaders, drawn or animated wordmarks, giant footer text, fade-up on scroll,
3D tilt or parallax, floating cards, hand-drawn underlines, decorative serif italics, glow, gradients,
"01 / 02 / 03" step rows. Motion is limited to hover colour changes and things that open (menus, dialogs).

## Surfaces and shape
- Cards: white, 1px `line` border that darkens on hover. No shadow.
- `shadow-pop` only for things that float: menus, toasts, dialogs.
- Radius: 6px buttons and inputs, 8px cards and panels, pills for search suggestions.
