-- CreateEnum
CREATE TYPE "ResourceType" AS ENUM ('PHARMACY_NOTES', 'STUDY_GUIDE', 'SYLLABUS', 'PYQ', 'GPAT_MATERIAL', 'NIPER_MATERIAL', 'DRUG_INSPECTOR_MATERIAL', 'RESEARCH_PAPER', 'THESIS', 'PRESENTATION', 'EBOOK', 'PDF_COLLECTION', 'MOCK_TEST', 'QUESTION_BANK', 'STUDY_PACKAGE');

-- CreateEnum
CREATE TYPE "ResourceAccess" AS ENUM ('FREE', 'PAID', 'PREMIUM');

-- CreateEnum
CREATE TYPE "ResourceStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "ResourceCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "parentId" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ResourceCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Resource" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "type" "ResourceType" NOT NULL,
    "categoryId" TEXT,
    "description" TEXT NOT NULL,
    "excerpt" TEXT,
    "author" TEXT,
    "access" "ResourceAccess" NOT NULL DEFAULT 'FREE',
    "pricePaise" INTEGER NOT NULL DEFAULT 0,
    "status" "ResourceStatus" NOT NULL DEFAULT 'DRAFT',
    "fileId" TEXT,
    "fileType" TEXT,
    "fileSizeBytes" INTEGER,
    "pageCount" INTEGER,
    "previewImages" TEXT[],
    "downloadCount" INTEGER NOT NULL DEFAULT 0,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "ratingSum" INTEGER NOT NULL DEFAULT 0,
    "ratingCount" INTEGER NOT NULL DEFAULT 0,
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "ogImageUrl" TEXT,
    "abstract" TEXT,
    "citation" TEXT,
    "doi" TEXT,
    "publishedYear" INTEGER,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Resource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResourceTag" (
    "resourceId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "ResourceTag_pkey" PRIMARY KEY ("resourceId","tagId")
);

-- CreateTable
CREATE TABLE "Buyer" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Buyer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BuyerAuthToken" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "code" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BuyerAuthToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResourcePurchase" (
    "id" TEXT NOT NULL,
    "receiptNo" TEXT NOT NULL,
    "buyerId" TEXT,
    "resourceId" TEXT NOT NULL,
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

    CONSTRAINT "ResourcePurchase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResourceReview" (
    "id" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "title" TEXT,
    "body" TEXT,
    "status" "ReviewStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResourceReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResourceBookmark" (
    "id" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ResourceBookmark_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResourceDownload" (
    "id" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "buyerId" TEXT,
    "email" TEXT,
    "ip" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ResourceDownload_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ResourceCategory_slug_key" ON "ResourceCategory"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Resource_slug_key" ON "Resource"("slug");

-- CreateIndex
CREATE INDEX "Resource_type_status_idx" ON "Resource"("type", "status");

-- CreateIndex
CREATE INDEX "Resource_access_status_idx" ON "Resource"("access", "status");

-- CreateIndex
CREATE INDEX "Resource_categoryId_idx" ON "Resource"("categoryId");

-- CreateIndex
CREATE INDEX "Resource_status_publishedAt_idx" ON "Resource"("status", "publishedAt");

-- CreateIndex
CREATE INDEX "Resource_featured_idx" ON "Resource"("featured");

-- CreateIndex
CREATE INDEX "ResourceTag_tagId_idx" ON "ResourceTag"("tagId");

-- CreateIndex
CREATE UNIQUE INDEX "Buyer_email_key" ON "Buyer"("email");

-- CreateIndex
CREATE UNIQUE INDEX "BuyerAuthToken_tokenHash_key" ON "BuyerAuthToken"("tokenHash");

-- CreateIndex
CREATE INDEX "BuyerAuthToken_email_idx" ON "BuyerAuthToken"("email");

-- CreateIndex
CREATE INDEX "BuyerAuthToken_expiresAt_idx" ON "BuyerAuthToken"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "ResourcePurchase_receiptNo_key" ON "ResourcePurchase"("receiptNo");

-- CreateIndex
CREATE INDEX "ResourcePurchase_buyerId_idx" ON "ResourcePurchase"("buyerId");

-- CreateIndex
CREATE INDEX "ResourcePurchase_resourceId_idx" ON "ResourcePurchase"("resourceId");

-- CreateIndex
CREATE INDEX "ResourcePurchase_status_idx" ON "ResourcePurchase"("status");

-- CreateIndex
CREATE INDEX "ResourcePurchase_email_idx" ON "ResourcePurchase"("email");

-- CreateIndex
CREATE INDEX "ResourcePurchase_razorpayOrderId_idx" ON "ResourcePurchase"("razorpayOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "ResourceReview_resourceId_buyerId_key" ON "ResourceReview"("resourceId", "buyerId");

-- CreateIndex
CREATE INDEX "ResourceReview_resourceId_status_idx" ON "ResourceReview"("resourceId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "ResourceBookmark_buyerId_resourceId_key" ON "ResourceBookmark"("buyerId", "resourceId");

-- CreateIndex
CREATE INDEX "ResourceBookmark_resourceId_idx" ON "ResourceBookmark"("resourceId");

-- CreateIndex
CREATE INDEX "ResourceDownload_resourceId_createdAt_idx" ON "ResourceDownload"("resourceId", "createdAt");

-- CreateIndex
CREATE INDEX "ResourceDownload_buyerId_idx" ON "ResourceDownload"("buyerId");

-- AddForeignKey
ALTER TABLE "ResourceCategory" ADD CONSTRAINT "ResourceCategory_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "ResourceCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Resource" ADD CONSTRAINT "Resource_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ResourceCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Resource" ADD CONSTRAINT "Resource_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "Media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResourceTag" ADD CONSTRAINT "ResourceTag_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "Resource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResourceTag" ADD CONSTRAINT "ResourceTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResourcePurchase" ADD CONSTRAINT "ResourcePurchase_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "Buyer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResourcePurchase" ADD CONSTRAINT "ResourcePurchase_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "Resource"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResourceReview" ADD CONSTRAINT "ResourceReview_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "Resource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResourceReview" ADD CONSTRAINT "ResourceReview_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "Buyer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResourceBookmark" ADD CONSTRAINT "ResourceBookmark_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "Buyer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResourceBookmark" ADD CONSTRAINT "ResourceBookmark_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "Resource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResourceDownload" ADD CONSTRAINT "ResourceDownload_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "Resource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResourceDownload" ADD CONSTRAINT "ResourceDownload_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "Buyer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
