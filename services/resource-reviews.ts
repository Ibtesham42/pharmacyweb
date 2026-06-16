import { Prisma, ReviewStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/** Recompute the denormalized rating aggregate from APPROVED reviews. */
async function recomputeRating(resourceId: string) {
  const agg = await prisma.resourceReview.aggregate({
    where: { resourceId, status: ReviewStatus.APPROVED },
    _sum: { rating: true },
    _count: true,
  });
  await prisma.resource.update({
    where: { id: resourceId },
    data: { ratingSum: agg._sum.rating ?? 0, ratingCount: agg._count },
  });
}

export async function submitReview(input: {
  resourceId: string;
  buyerId: string;
  rating: number;
  title?: string;
  body?: string;
  autoApprove: boolean;
}) {
  const status = input.autoApprove ? ReviewStatus.APPROVED : ReviewStatus.PENDING;
  const review = await prisma.resourceReview.upsert({
    where: { resourceId_buyerId: { resourceId: input.resourceId, buyerId: input.buyerId } },
    create: {
      resourceId: input.resourceId,
      buyerId: input.buyerId,
      rating: input.rating,
      title: input.title || null,
      body: input.body || null,
      status,
    },
    update: {
      rating: input.rating,
      title: input.title || null,
      body: input.body || null,
      status, // re-moderate edits
    },
  });
  if (status === ReviewStatus.APPROVED) await recomputeRating(input.resourceId);
  return review;
}

export async function listApprovedReviews(resourceId: string) {
  return prisma.resourceReview.findMany({
    where: { resourceId, status: ReviewStatus.APPROVED },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      rating: true,
      title: true,
      body: true,
      createdAt: true,
      buyer: { select: { name: true } },
    },
  });
}

export async function getBuyerReview(resourceId: string, buyerId: string) {
  return prisma.resourceReview.findUnique({
    where: { resourceId_buyerId: { resourceId, buyerId } },
    select: { id: true, rating: true, title: true, body: true, status: true },
  });
}

export async function listReviewsForAdmin(opts: { status?: ReviewStatus; page?: number }) {
  const page = Math.max(1, opts.page ?? 1);
  const perPage = 25;
  const where: Prisma.ResourceReviewWhereInput = { ...(opts.status && { status: opts.status }) };
  const [items, total] = await Promise.all([
    prisma.resourceReview.findMany({
      where,
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      skip: (page - 1) * perPage,
      take: perPage,
      select: {
        id: true,
        rating: true,
        title: true,
        body: true,
        status: true,
        createdAt: true,
        buyer: { select: { name: true, email: true } },
        resource: { select: { title: true, slug: true } },
      },
    }),
    prisma.resourceReview.count({ where }),
  ]);
  return { items, total, page, perPage, pages: Math.max(1, Math.ceil(total / perPage)) };
}

export async function pendingReviewCount() {
  return prisma.resourceReview.count({ where: { status: ReviewStatus.PENDING } });
}

export async function moderateReview(id: string, status: ReviewStatus) {
  const review = await prisma.resourceReview.update({ where: { id }, data: { status } });
  await recomputeRating(review.resourceId);
  return review;
}
