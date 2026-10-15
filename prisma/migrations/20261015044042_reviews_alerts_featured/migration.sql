-- DropIndex
DROP INDEX "Listing_brand_trgm";

-- DropIndex
DROP INDEX "Listing_description_trgm";

-- DropIndex
DROP INDEX "Listing_model_trgm";

-- DropIndex
DROP INDEX "Listing_title_trgm";

-- AlterTable
ALTER TABLE "Favorite" ADD COLUMN     "priceAtSave" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Listing" ADD COLUMN     "featuredUntil" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavedSearch" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavedSearch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SearchMatch" (
    "savedSearchId" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,

    CONSTRAINT "SearchMatch_pkey" PRIMARY KEY ("savedSearchId","listingId")
);

-- CreateIndex
CREATE INDEX "Review_sellerId_createdAt_idx" ON "Review"("sellerId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Review_reviewerId_sellerId_key" ON "Review"("reviewerId", "sellerId");

-- CreateIndex
CREATE UNIQUE INDEX "SavedSearch_userId_query_key" ON "SavedSearch"("userId", "query");

-- CreateIndex
CREATE INDEX "Favorite_listingId_idx" ON "Favorite"("listingId");

-- CreateIndex
CREATE INDEX "Image_listingId_position_idx" ON "Image"("listingId", "position");

-- CreateIndex
CREATE INDEX "Listing_status_featuredUntil_idx" ON "Listing"("status", "featuredUntil");

-- CreateIndex
CREATE INDEX "Listing_status_type_createdAt_idx" ON "Listing"("status", "type", "createdAt");

-- CreateIndex
CREATE INDEX "Listing_sellerId_idx" ON "Listing"("sellerId");

-- CreateIndex
CREATE INDEX "Report_listingId_idx" ON "Report"("listingId");

-- CreateIndex
CREATE INDEX "Report_resolved_createdAt_idx" ON "Report"("resolved", "createdAt");

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedSearch" ADD CONSTRAINT "SavedSearch_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SearchMatch" ADD CONSTRAINT "SearchMatch_savedSearchId_fkey" FOREIGN KEY ("savedSearchId") REFERENCES "SavedSearch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
