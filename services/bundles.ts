import { Prisma, ResourceStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { toSlug, uniqueSlug } from "@/lib/slug";
import type { BundleInput } from "@/lib/validation";

const slugExists = (slug: string, exceptId?: string) =>
  prisma.bundle
    .findFirst({ where: { slug, ...(exceptId ? { id: { not: exceptId } } : {}) }, select: { id: true } })
    .then(Boolean);

function publishedAtFor(status: ResourceStatus, current?: Date | null): Date | null {
  if (status === ResourceStatus.PUBLISHED) return current ?? new Date();
  return current ?? null;
}

function itemsCreate(resourceIds: string[]) {
  return resourceIds
    .filter(Boolean)
    .map((resourceId, i) => ({ resourceId, sortOrder: i }));
}

export async function createBundle(input: BundleInput) {
  const slug = await uniqueSlug(input.slug || input.title, (s) => slugExists(s));
  return prisma.bundle.create({
    data: {
      title: input.title,
      slug,
      description: input.description,
      excerpt: input.excerpt || null,
      examType: input.examType || null,
      pricePaise: input.pricePaise,
      status: input.status,
      coverImage: input.coverImage || null,
      previewImages: input.previewImages,
      metaTitle: input.metaTitle || null,
      metaDescription: input.metaDescription || null,
      ogImageUrl: input.ogImageUrl || null,
      featured: input.featured,
      publishedAt: publishedAtFor(input.status),
      items: { create: itemsCreate(input.resourceIds) },
    },
  });
}

export async function updateBundle(id: string, input: BundleInput) {
  const existing = await prisma.bundle.findUnique({ where: { id }, select: { slug: true, publishedAt: true } });
  if (!existing) throw new Error("NOT_FOUND");
  const desired = input.slug ? toSlug(input.slug) : existing.slug;
  const slug = desired === existing.slug ? existing.slug : await uniqueSlug(desired, (s) => slugExists(s, id));

  return prisma.bundle.update({
    where: { id },
    data: {
      title: input.title,
      slug,
      description: input.description,
      excerpt: input.excerpt || null,
      examType: input.examType || null,
      pricePaise: input.pricePaise,
      status: input.status,
      coverImage: input.coverImage || null,
      previewImages: input.previewImages,
      metaTitle: input.metaTitle || null,
      metaDescription: input.metaDescription || null,
      ogImageUrl: input.ogImageUrl || null,
      featured: input.featured,
      publishedAt: publishedAtFor(input.status, existing.publishedAt),
      items: { deleteMany: {}, create: itemsCreate(input.resourceIds) },
    },
  });
}

export async function setBundleStatus(id: string, status: ResourceStatus) {
  const existing = await prisma.bundle.findUnique({ where: { id }, select: { publishedAt: true } });
  return prisma.bundle.update({
    where: { id },
    data: { status, publishedAt: publishedAtFor(status, existing?.publishedAt) },
  });
}

export async function softDeleteBundle(id: string) {
  return prisma.bundle.update({
    where: { id },
    data: { deletedAt: new Date(), status: ResourceStatus.ARCHIVED },
  });
}

const BUNDLE_CARD_SELECT = {
  id: true,
  title: true,
  slug: true,
  excerpt: true,
  examType: true,
  pricePaise: true,
  coverImage: true,
  featured: true,
  publishedAt: true,
  _count: { select: { items: true } },
} satisfies Prisma.BundleSelect;

export type BundleCard = Prisma.BundleGetPayload<{ select: typeof BUNDLE_CARD_SELECT }>;

export async function listBundles(opts: { q?: string; page?: number; perPage?: number }) {
  const page = Math.max(1, opts.page ?? 1);
  const perPage = opts.perPage ?? 12;
  const where: Prisma.BundleWhereInput = {
    status: ResourceStatus.PUBLISHED,
    deletedAt: null,
    ...(opts.q && {
      OR: [
        { title: { contains: opts.q, mode: "insensitive" } },
        { description: { contains: opts.q, mode: "insensitive" } },
        { examType: { contains: opts.q, mode: "insensitive" } },
      ],
    }),
  };
  const [items, total] = await Promise.all([
    prisma.bundle.findMany({
      where,
      orderBy: [{ featured: "desc" }, { publishedAt: "desc" }],
      skip: (page - 1) * perPage,
      take: perPage,
      select: BUNDLE_CARD_SELECT,
    }),
    prisma.bundle.count({ where }),
  ]);
  return { items, total, page, perPage, pages: Math.max(1, Math.ceil(total / perPage)) };
}

export function getFeaturedBundles(limit = 4): Promise<BundleCard[]> {
  return prisma.bundle.findMany({
    where: { status: ResourceStatus.PUBLISHED, deletedAt: null, featured: true },
    orderBy: { publishedAt: "desc" },
    take: limit,
    select: BUNDLE_CARD_SELECT,
  });
}

/** Public bundle + its items (resources) + the un-bundled total (for savings). */
export async function getBundleBySlug(slug: string) {
  const bundle = await prisma.bundle.findFirst({
    where: { slug, status: ResourceStatus.PUBLISHED, deletedAt: null },
    include: {
      items: {
        orderBy: { sortOrder: "asc" },
        select: {
          resource: {
            select: {
              id: true,
              title: true,
              slug: true,
              type: true,
              access: true,
              pricePaise: true,
              fileType: true,
              status: true,
              deletedAt: true,
            },
          },
        },
      },
    },
  });
  if (!bundle) return null;
  const resources = bundle.items
    .map((i) => i.resource)
    .filter((r) => r.deletedAt === null && r.status === ResourceStatus.PUBLISHED);
  const originalTotalPaise = resources.reduce((sum, r) => sum + (r.access === "FREE" ? 0 : r.pricePaise), 0);
  return { ...bundle, resources, originalTotalPaise };
}

export async function getBundleForEdit(id: string) {
  return prisma.bundle.findUnique({
    where: { id },
    include: {
      items: { orderBy: { sortOrder: "asc" }, select: { resourceId: true } },
    },
  });
}

export async function listAdminBundles(opts: { status?: string; q?: string; page?: number }) {
  const page = Math.max(1, opts.page ?? 1);
  const perPage = 20;
  const where: Prisma.BundleWhereInput = {
    deletedAt: null,
    ...(opts.status && { status: opts.status as Prisma.BundleWhereInput["status"] }),
    ...(opts.q && { title: { contains: opts.q, mode: "insensitive" } }),
  };
  const [items, total] = await Promise.all([
    prisma.bundle.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
      select: {
        id: true,
        title: true,
        slug: true,
        examType: true,
        pricePaise: true,
        status: true,
        featured: true,
        updatedAt: true,
        _count: { select: { items: true, purchases: true } },
      },
    }),
    prisma.bundle.count({ where }),
  ]);
  return { items, total, page, perPage, pages: Math.max(1, Math.ceil(total / perPage)) };
}

export async function getPublishedBundleSlugs(): Promise<string[]> {
  const rows = await prisma.bundle.findMany({
    where: { status: ResourceStatus.PUBLISHED, deletedAt: null },
    select: { slug: true },
    take: 1000,
  });
  return rows.map((r) => r.slug);
}

export async function incrementBundleView(id: string) {
  await prisma.bundle.update({ where: { id }, data: { viewCount: { increment: 1 } } }).catch(() => {});
}
