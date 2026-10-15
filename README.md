# Used bikes and scooters marketplace (Nepal)

P2P marketplace for second-hand motorcycles and scooters in Nepal.

Next.js 16 (App Router, TypeScript, Tailwind v4) · Prisma · PostgreSQL.

## Features

- Browse and search: filter by type, brand, city, price, year, mileage; sorting; pagination
- Listings with up to 4 photos (stored in `./uploads`, validated by file signature)
- Email one-time-code login (sent through the Gmail API; printed to the console when unconfigured)
- Contact sellers by in-app chat (polling), call or WhatsApp; save bikes; report ads
- Owners manage ads (edit, mark sold, delete); edits go back for review
- Admin page to approve or reject ads, handle reports, suspend users and feature ads
- Seller ratings and reviews: buyers who have messaged a seller can rate them 1–5 stars; ratings show on ad cards, the ad page and a seller profile page
- Alerts by email: save a search to be told when a matching bike goes live, and get a price-drop email for bikes you saved
- Compare up to 3 bikes side by side
- Featured ads: admins can pin an ad to the top of Browse and the home page for 7, 14 or 30 days

## Run locally

```
cp .env.example .env        # then set AUTH_SECRET and ADMIN_EMAILS
docker compose up -d        # Postgres on :5434
npx prisma migrate dev
npm run seed                # optional demo listings
npm run dev
```

Set `SITE_URL` to the public address so links in alert emails are correct.
`ADMIN_EMAILS` is a comma-separated list. Those accounts get the Admin page on their next login.

## Tests

```
npm test               # unit + integration (needs the Postgres container; uses the separate motovo_test database)
npm run test:e2e       # Chromium tests against a production build (first time: npx playwright install chromium)
npm run test:report    # runs everything and writes TEST_REPORT.md with PASS/FAIL per test
npm run build && npm run perf -- <label>   # load-time measurements on 3,000 synthetic listings
```

Tests never touch the development database and never send real email. `npm run photos` downloads
freely licensed bike photos (credits in `scripts/photos/CREDITS.json`) that `npm run seed` uses.

## Gmail OTP

Create a Google Cloud OAuth client, enable the Gmail API, authorise the `gmail.send` scope, and put
`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN` and `GMAIL_SENDER` in `.env`.
With these empty, codes are printed in the server console.

## Before production

Move photo storage to S3/Cloudinary (local disk is not shared across instances), add a rate limit
per IP on the OTP endpoints, and put the app behind HTTPS.
