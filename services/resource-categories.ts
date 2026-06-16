import { prisma } from "@/lib/prisma";
import { toSlug, uniqueSlug } from "@/lib/slug";
import { z } from "zod";
import { resourceCategorySchema } from "@/lib/validation";

type CategoryInput = z.infer<typeof resourceCategorySchema>;

const exists = (slug: string, exceptId?: string) =>
  prisma.resourceCategory
    .findFirst({ where: { slug, ...(exceptId ? { id: { not: exceptId } } : {}) }, select: { id: true } })
    .then(Boolean);

export async function listResourceCategories() {
  return prisma.resourceCategory.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: { _count: { select: { resources: true } } },
  });
}

/** Categories that have at least one published resource (for public filters). */
export async function listPublicResourceCategories() {
  const rows = await prisma.resourceCategory.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      slug: true,
      _count: { select: { resources: { where: { status: "PUBLISHED", deletedAt: null } } } },
    },
  });
  return rows.filter((r) => r._count.resources > 0);
}

export async function getResourceCategoryBySlug(slug: string) {
  return prisma.resourceCategory.findUnique({ where: { slug } });
}

export async function createResourceCategory(input: CategoryInput) {
  const slug = await uniqueSlug(input.slug || input.name, (s) => exists(s));
  return prisma.resourceCategory.create({
    data: {
      name: input.name,
      slug,
      description: input.description || null,
      parentId: input.parentId || null,
      sortOrder: input.sortOrder,
    },
  });
}

export async function updateResourceCategory(id: string, input: CategoryInput) {
  const current = await prisma.resourceCategory.findUnique({ where: { id }, select: { slug: true } });
  if (!current) throw new Error("NOT_FOUND");
  const desired = input.slug ? toSlug(input.slug) : current.slug;
  const slug = desired === current.slug ? current.slug : await uniqueSlug(desired, (s) => exists(s, id));
  return prisma.resourceCategory.update({
    where: { id },
    data: {
      name: input.name,
      slug,
      description: input.description || null,
      parentId: input.parentId || null,
      sortOrder: input.sortOrder,
    },
  });
}

export async function deleteResourceCategory(id: string) {
  // Resources keep their data; categoryId is set NULL by the FK on delete.
  return prisma.resourceCategory.delete({ where: { id } });
}
