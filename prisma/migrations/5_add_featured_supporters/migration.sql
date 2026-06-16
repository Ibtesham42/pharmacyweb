-- CreateEnum
CREATE TYPE "FeatureStatus" AS ENUM ('NONE', 'PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "Donation"
  ADD COLUMN "featureStatus" "FeatureStatus" NOT NULL DEFAULT 'NONE',
  ADD COLUMN "featuredMessage" TEXT,
  ADD COLUMN "featuredAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Donation_featureStatus_featuredAt_idx" ON "Donation"("featureStatus", "featuredAt");

-- Data migration: surface existing opt-ins so the admin can approve them without
-- requiring a new donation. Donors who already consented enter the PENDING queue.
UPDATE "Donation"
SET "featureStatus" = 'PENDING'
WHERE "supporterConsent" = true
  AND "featureStatus" = 'NONE';
