-- CreateTable
CREATE TABLE "Bundle" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "excerpt" TEXT,
    "examType" TEXT,
    "pricePaise" INTEGER NOT NULL DEFAULT 0,
    "status" "ResourceStatus" NOT NULL DEFAULT 'DRAFT',
    "coverImage" TEXT,
    "previewImages" TEXT[],
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "ogImageUrl" TEXT,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "publishedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Bundle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BundleItem" (
    "bundleId" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "BundleItem_pkey" PRIMARY KEY ("bundleId","resourceId")
);

-- CreateTable
CREATE TABLE "BundlePurchase" (
    "id" TEXT NOT NULL,
    "receiptNo" TEXT NOT NULL,
    "buyerId" TEXT,
    "bundleId" TEXT NOT NULL,
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

    CONSTRAINT "BundlePurchase_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Bundle_slug_key" ON "Bundle"("slug");

-- CreateIndex
CREATE INDEX "Bundle_status_publishedAt_idx" ON "Bundle"("status", "publishedAt");

-- CreateIndex
CREATE INDEX "Bundle_featured_idx" ON "Bundle"("featured");

-- CreateIndex
CREATE INDEX "BundleItem_resourceId_idx" ON "BundleItem"("resourceId");

-- CreateIndex
CREATE UNIQUE INDEX "BundlePurchase_receiptNo_key" ON "BundlePurchase"("receiptNo");

-- CreateIndex
CREATE INDEX "BundlePurchase_buyerId_idx" ON "BundlePurchase"("buyerId");

-- CreateIndex
CREATE INDEX "BundlePurchase_bundleId_idx" ON "BundlePurchase"("bundleId");

-- CreateIndex
CREATE INDEX "BundlePurchase_status_idx" ON "BundlePurchase"("status");

-- CreateIndex
CREATE INDEX "BundlePurchase_email_idx" ON "BundlePurchase"("email");

-- CreateIndex
CREATE INDEX "BundlePurchase_razorpayOrderId_idx" ON "BundlePurchase"("razorpayOrderId");

-- AddForeignKey
ALTER TABLE "BundleItem" ADD CONSTRAINT "BundleItem_bundleId_fkey" FOREIGN KEY ("bundleId") REFERENCES "Bundle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BundleItem" ADD CONSTRAINT "BundleItem_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "Resource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BundlePurchase" ADD CONSTRAINT "BundlePurchase_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "Buyer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BundlePurchase" ADD CONSTRAINT "BundlePurchase_bundleId_fkey" FOREIGN KEY ("bundleId") REFERENCES "Bundle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
