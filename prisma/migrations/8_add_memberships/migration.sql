-- CreateTable
CREATE TABLE "MembershipPlan" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "durationDays" INTEGER NOT NULL,
    "pricePaise" INTEGER NOT NULL,
    "badge" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MembershipPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Membership" (
    "id" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "planId" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Membership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MembershipPurchase" (
    "id" TEXT NOT NULL,
    "receiptNo" TEXT NOT NULL,
    "buyerId" TEXT,
    "planId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "amountPaise" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "method" "DonationMethod" NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "razorpayOrderId" TEXT,
    "razorpayPaymentId" TEXT,
    "transactionRef" TEXT,
    "ip" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paidAt" TIMESTAMP(3),

    CONSTRAINT "MembershipPurchase_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MembershipPlan_active_sortOrder_idx" ON "MembershipPlan"("active", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "Membership_buyerId_key" ON "Membership"("buyerId");

-- CreateIndex
CREATE INDEX "Membership_expiresAt_idx" ON "Membership"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "MembershipPurchase_receiptNo_key" ON "MembershipPurchase"("receiptNo");

-- CreateIndex
CREATE INDEX "MembershipPurchase_buyerId_idx" ON "MembershipPurchase"("buyerId");

-- CreateIndex
CREATE INDEX "MembershipPurchase_planId_idx" ON "MembershipPurchase"("planId");

-- CreateIndex
CREATE INDEX "MembershipPurchase_status_idx" ON "MembershipPurchase"("status");

-- CreateIndex
CREATE INDEX "MembershipPurchase_email_idx" ON "MembershipPurchase"("email");

-- CreateIndex
CREATE INDEX "MembershipPurchase_razorpayOrderId_idx" ON "MembershipPurchase"("razorpayOrderId");

-- AddForeignKey
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "Buyer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_planId_fkey" FOREIGN KEY ("planId") REFERENCES "MembershipPlan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MembershipPurchase" ADD CONSTRAINT "MembershipPurchase_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "Buyer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MembershipPurchase" ADD CONSTRAINT "MembershipPurchase_planId_fkey" FOREIGN KEY ("planId") REFERENCES "MembershipPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
