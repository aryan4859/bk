# Used bikes and scooters marketplace (Nepal)

P2P marketplace for second-hand motorcycles and scooters in Nepal.

Next.js 16 (App Router, TypeScript, Tailwind v4) · Prisma · PostgreSQL.

## Features

- Browse and search: filter by type, brand, city, price, year, mileage; sorting; pagination
- Listings with up to 4 photos (stored in `./uploads`, validated by file signature)
- Email one-time-code login (sent through the Gmail API; printed to the console when unconfigured)
- Contact sellers by in-app chat (polling), call or WhatsApp; save bikes; report ads
- Owners manage ads (edit, mark sold, delete); edits go back for review
- Admin page to approve or reject ads and handle reports

## Run locally

```
cp .env.example .env        # then set AUTH_SECRET and ADMIN_EMAILS
docker compose up -d        # Postgres on :5434
npx prisma migrate dev
npm run seed                # optional demo listings
npm run dev
```

`ADMIN_EMAILS` is a comma-separated list. Those accounts get the Admin page on their next login.

## Gmail OTP

Create a Google Cloud OAuth client, enable the Gmail API, authorise the `gmail.send` scope, and put
`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN` and `GMAIL_SENDER` in `.env`.
With these empty, codes are printed in the server console.

## Before production

Move photo storage to S3/Cloudinary (local disk is not shared across instances), add a rate limit
per IP on the OTP endpoints, and put the app behind HTTPS.
