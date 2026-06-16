import { prisma } from "@/lib/prisma";

/** Toggle a bookmark; returns the new state. */
export async function toggleBookmark(buyerId: string, resourceId: string): Promise<{ bookmarked: boolean }> {
  const existing = await prisma.resourceBookmark.findUnique({
    where: { buyerId_resourceId: { buyerId, resourceId } },
    select: { id: true },
  });
  if (existing) {
    await prisma.resourceBookmark.delete({ where: { id: existing.id } });
    return { bookmarked: false };
  }
  await prisma.resourceBookmark.create({ data: { buyerId, resourceId } });
  return { bookmarked: true };
}

export async function isBookmarked(buyerId: string, resourceId: string): Promise<boolean> {
  const row = await prisma.resourceBookmark.findUnique({
    where: { buyerId_resourceId: { buyerId, resourceId } },
    select: { id: true },
  });
  return Boolean(row);
}

export async function listBuyerBookmarks(buyerId: string) {
  const rows = await prisma.resourceBookmark.findMany({
    where: { buyerId },
    orderBy: { createdAt: "desc" },
    select: {
      resource: {
        select: {
          id: true,
          title: true,
          slug: true,
          type: true,
          access: true,
          pricePaise: true,
          previewImages: true,
          ratingSum: true,
          ratingCount: true,
          deletedAt: true,
          status: true,
        },
      },
    },
  });
  return rows
    .map((r) => r.resource)
    .filter((r) => r && r.deletedAt === null && r.status === "PUBLISHED");
}
