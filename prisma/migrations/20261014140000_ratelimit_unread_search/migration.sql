-- Rate limiting
CREATE TABLE "RateLimit" (
    "key" TEXT NOT NULL,
    "count" INTEGER NOT NULL,
    "resetAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "RateLimit_pkey" PRIMARY KEY ("key")
);

-- Unread tracking (existing conversations start as read)
ALTER TABLE "Thread" ADD COLUMN "buyerReadAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN "sellerReadAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Trigram indexes so the case-insensitive substring search on /listings avoids sequential scans.
-- Not modelled in schema.prisma (Prisma can't express gin_trgm_ops without preview features).
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX "Listing_title_trgm" ON "Listing" USING GIN ("title" gin_trgm_ops);
CREATE INDEX "Listing_model_trgm" ON "Listing" USING GIN ("model" gin_trgm_ops);
CREATE INDEX "Listing_brand_trgm" ON "Listing" USING GIN ("brand" gin_trgm_ops);
CREATE INDEX "Listing_description_trgm" ON "Listing" USING GIN ("description" gin_trgm_ops);

-- Common browse sorts/filters on active listings
CREATE INDEX "Listing_status_priceNpr_idx" ON "Listing"("status", "priceNpr");
