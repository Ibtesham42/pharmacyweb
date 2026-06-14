import { prisma } from "@/lib/prisma";

export async function listTags() {
  return prisma.tag.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { posts: true } } },
  });
}

/** Most-used tags (for tag clouds / filters). */
export async function popularTags(limit = 20) {
  const tags = await prisma.tag.findMany({
    include: { _count: { select: { posts: true } } },
    orderBy: { posts: { _count: "desc" } },
    take: limit,
  });
  return tags.filter((t) => t._count.posts > 0);
}

export async function getTagBySlug(slug: string) {
  return prisma.tag.findUnique({ where: { slug } });
}

export async function deleteTag(id: string) {
  return prisma.tag.delete({ where: { id } });
}
