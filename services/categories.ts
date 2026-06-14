import { prisma } from "@/lib/prisma";
import { toSlug, uniqueSlug } from "@/lib/slug";
import type { CategoryInput } from "@/lib/validation";

const blank = (v?: string | null) => (v && v.length ? v : undefined);

export async function listCategories() {
  return prisma.category.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { posts: true } }, parent: { select: { name: true } } },
  });
}

/** Categories that have at least one visible post — for public nav. */
export async function listPublicCategories() {
  return prisma.category.findMany({
    where: { posts: { some: { deletedAt: null, status: "PUBLISHED" } } },
    orderBy: { name: "asc" },
    include: { _count: { select: { posts: { where: { deletedAt: null, status: "PUBLISHED" } } } } },
  });
}

export async function getCategoryBySlug(slug: string) {
  return prisma.category.findUnique({ where: { slug } });
}

export async function createCategory(input: CategoryInput) {
  const slug = await uniqueSlug(input.slug || input.name, (s) =>
    prisma.category.findUnique({ where: { slug: s }, select: { id: true } }).then(Boolean),
  );
  return prisma.category.create({
    data: {
      name: input.name,
      slug,
      description: blank(input.description),
      parentId: blank(input.parentId),
    },
  });
}

export async function updateCategory(id: string, input: CategoryInput) {
  const slug = await uniqueSlug(input.slug || input.name, async (s) => {
    const found = await prisma.category.findUnique({ where: { slug: s }, select: { id: true } });
    return !!found && found.id !== id;
  });
  return prisma.category.update({
    where: { id },
    data: {
      name: input.name,
      slug,
      description: blank(input.description) ?? null,
      parentId: blank(input.parentId) ?? null,
    },
  });
}

export async function deleteCategory(id: string) {
  // Posts keep their FK set to null (categoryId is optional).
  await prisma.post.updateMany({ where: { categoryId: id }, data: { categoryId: null } });
  return prisma.category.delete({ where: { id } });
}
