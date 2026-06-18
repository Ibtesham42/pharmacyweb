-- CreateEnum
CREATE TYPE "MembershipStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED', 'EXPIRED');

-- AlterTable: Membership gains a lifecycle status + nullable expiry + review audit
ALTER TABLE "Membership" ADD COLUMN     "status" "MembershipStatus" NOT NULL DEFAULT 'PENDING',
                         ADD COLUMN     "purchaseId" TEXT,
                         ADD COLUMN     "reviewedAt" TIMESTAMP(3),
                         ADD COLUMN     "reviewedById" TEXT;
ALTER TABLE "Membership" ALTER COLUMN "expiresAt" DROP NOT NULL;

-- AlterTable: MembershipPurchase gains an admin verification status
ALTER TABLE "MembershipPurchase" ADD COLUMN     "membershipStatus" "MembershipStatus" NOT NULL DEFAULT 'PENDING';

-- CreateIndex
CREATE INDEX "Membership_status_idx" ON "Membership"("status");
CREATE INDEX "MembershipPurchase_membershipStatus_idx" ON "MembershipPurchase"("membershipStatus");

-- Backfill: existing memberships were auto-granted under the old flow, so they
-- are effectively approved — keep their access. Existing PAID purchases are
-- likewise treated as approved so history stays consistent.
UPDATE "Membership" SET "status" = 'APPROVED';
UPDATE "MembershipPurchase" SET "membershipStatus" = 'APPROVED' WHERE "status" = 'PAID';
