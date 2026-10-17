-- CreateEnum
CREATE TYPE "BikeCondition" AS ENUM ('EXCELLENT', 'GOOD', 'FAIR', 'NEEDS_WORK');

-- AlterTable
ALTER TABLE "Listing" ADD COLUMN     "condition" "BikeCondition",
ADD COLUMN     "lotNumber" INTEGER;
