import { prisma } from "@/lib/prisma";
import { PostType } from "@prisma/client";

/** Toggle a saved job/article/news post for a user; returns the new state. */
export async function togglePostBookmark(userId: string, postId: string): Promise<{ bookmarked: boolean }> {
  const existing = await prisma.postBookmark.findUnique({
    where: { userId_postId: { userId, postId } },
    select: { id: true },
  });
  if (existing) {
    await prisma.postBookmark.delete({ where: { id: existing.id } });
    return { bookmarked: false };
  }
  await prisma.postBookmark.create({ data: { userId, postId } });
  return { bookmarked: true };
}

export async function isPostBookmarked(userId: string, postId: string): Promise<boolean> {
  const row = await prisma.postBookmark.findUnique({
    where: { userId_postId: { userId, postId } },
    select: { id: true },
  });
  return Boolean(row);
}

/** A user's saved posts, optionally filtered by type (JOB / ARTICLE / NEWS). */
export async function listUserPostBookmarks(userId: string, type?: PostType) {
  const rows = await prisma.postBookmark.findMany({
    where: { userId, post: { deletedAt: null, status: "PUBLISHED", ...(type ? { type } : {}) } },
    orderBy: { createdAt: "desc" },
    select: {
      post: {
        select: {
          id: true,
          title: true,
          slug: true,
          type: true,
          excerpt: true,
          publishedAt: true,
          category: { select: { name: true } },
        },
      },
    },
  });
  return rows.map((r) => r.post);
}
