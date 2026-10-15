-- pg_trgm ships with PostgreSQL (contrib) and is what lets GIN indexes serve ILIKE '%text%' searches
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- CreateIndex
CREATE INDEX "Listing_title_trgm_idx" ON "Listing" USING GIN ("title" gin_trgm_ops);

-- CreateIndex
CREATE INDEX "Listing_model_trgm_idx" ON "Listing" USING GIN ("model" gin_trgm_ops);

-- CreateIndex
CREATE INDEX "Listing_brand_trgm_idx" ON "Listing" USING GIN ("brand" gin_trgm_ops);

-- CreateIndex
CREATE INDEX "Listing_description_trgm_idx" ON "Listing" USING GIN ("description" gin_trgm_ops);
