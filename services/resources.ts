import { Prisma, ResourceStatus, ResourceAccess, ResourceType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { toSlug, uniqueSlug } from "@/lib/slug";
import { hasActiveMembership } from "@/services/memberships";
import type { ResourceInput } from "@/lib/validation";

/** Resource types that make up the Thesis & Research library. */
export const RESEARCH_RESOURCE_TYPES: ResourceType[] = [
  ResourceType.RESEARCH_PAPER,
  ResourceType.THESIS,
];

const slugExists = (slug: string, exceptId?: string) =>
  prisma.resource
    .findFirst({ where: { slug, ...(exceptId ? { id: { not: exceptId } } : {}) }, select: { id: true } })
    .then(Boolean);

/** Nested write to attach tags by name (reuses the shared Tag table). */
function tagCreate(tagNames: string[]) {
  return tagNames
    .map((n) => n.trim())
    .filter(Boolean)
    .map((name) => ({
      tag: {
        connectOrCreate: {
          where: { slug: toSlug(name) },
          create: { name, slug: toSlug(name) },
        },
      },
    }));
}

function publishedAtFor(status: ResourceStatus, current?: Date | null): Date | null {
  if (status === ResourceStatus.PUBLISHED) return current ?? new Date();
  return current ?? null;
}

export async function createResource(input: ResourceInput) {
  const slug = await uniqueSlug(input.slug || input.title, (s) => slugExists(s));
  return prisma.resource.create({
    data: {
      title: input.title,
      slug,
      type: input.type,
      categoryId: input.categoryId || null,
      description: input.description,
      excerpt: input.excerpt || null,
      author: input.author || null,
      access: input.access,
      pricePaise: input.access === ResourceAccess.PAID ? input.pricePaise : 0,
      status: input.status,
      fileId: input.fileId || null,
      fileType: input.fileType || null,
      fileSizeBytes: input.fileSizeBytes ?? null,
      pageCount: input.pageCount ?? null,
      previewImages: input.previewImages,
      metaTitle: input.metaTitle || null,
      metaDescription: input.metaDescription || null,
      ogImageUrl: input.ogImageUrl || null,
      abstract: input.abstract || null,
      citation: input.citation || null,
      doi: input.doi || null,
      publishedYear: input.publishedYear ?? null,
      featured: input.featured,
      publishedAt: publishedAtFor(input.status),
      tags: { create: tagCreate(input.tags) },
    },
  });
}

export async function updateResource(id: string, input: ResourceInput) {
  const existing = await prisma.resource.findUnique({ where: { id }, select: { slug: true, publishedAt: true } });
  if (!existing) throw new Error("NOT_FOUND");
  const desired = input.slug ? toSlug(input.slug) : existing.slug;
  const slug = desired === existing.slug ? existing.slug : await uniqueSlug(desired, (s) => slugExists(s, id));

  return prisma.resource.update({
    where: { id },
    data: {
      title: input.title,
      slug,
      type: input.type,
      categoryId: input.categoryId || null,
      description: input.description,
      excerpt: input.excerpt || null,
      author: input.author || null,
      access: input.access,
      pricePaise: input.access === ResourceAccess.PAID ? input.pricePaise : 0,
      status: input.status,
      fileId: input.fileId || null,
      fileType: input.fileType || null,
      fileSizeBytes: input.fileSizeBytes ?? null,
      pageCount: input.pageCount ?? null,
      previewImages: input.previewImages,
      metaTitle: input.metaTitle || null,
      metaDescription: input.metaDescription || null,
      ogImageUrl: input.ogImageUrl || null,
      abstract: input.abstract || null,
      citation: input.citation || null,
      doi: input.doi || null,
      publishedYear: input.publishedYear ?? null,
      featured: input.featured,
      publishedAt: publishedAtFor(input.status, existing.publishedAt),
      tags: { deleteMany: {}, create: tagCreate(input.tags) },
    },
  });
}

export async function setResourceStatus(id: string, status: ResourceStatus) {
  const existing = await prisma.resource.findUnique({ where: { id }, select: { publishedAt: true } });
  return prisma.resource.update({
    where: { id },
    data: { status, publishedAt: publishedAtFor(status, existing?.publishedAt) },
  });
}

export async function softDeleteResource(id: string) {
  return prisma.resource.update({ where: { id }, data: { deletedAt: new Date(), status: ResourceStatus.ARCHIVED } });
}

export interface ResourceListOpts {
  type?: string;
  categoryId?: string;
  access?: string;
  q?: string;
  page?: number;
  perPage?: number;
}

const PUBLIC_CARD_SELECT = {
  id: true,
  title: true,
  slug: true,
  type: true,
  access: true,
  pricePaise: true,
  excerpt: true,
  author: true,
  previewImages: true,
  fileType: true,
  downloadCount: true,
  ratingSum: true,
  ratingCount: true,
  featured: true,
  publishedAt: true,
  category: { select: { name: true, slug: true } },
} satisfies Prisma.ResourceSelect;

export type ResourceCard = Prisma.ResourceGetPayload<{ select: typeof PUBLIC_CARD_SELECT }>;

function publicWhere(opts: ResourceListOpts): Prisma.ResourceWhereInput {
  return {
    status: ResourceStatus.PUBLISHED,
    deletedAt: null,
    ...(opts.type && { type: opts.type as Prisma.ResourceWhereInput["type"] }),
    ...(opts.categoryId && { categoryId: opts.categoryId }),
    ...(opts.access && { access: opts.access as Prisma.ResourceWhereInput["access"] }),
    ...(opts.q && {
      OR: [
        { title: { contains: opts.q, mode: "insensitive" } },
        { description: { contains: opts.q, mode: "insensitive" } },
        { author: { contains: opts.q, mode: "insensitive" } },
      ],
    }),
  };
}

export async function listResources(opts: ResourceListOpts) {
  const page = Math.max(1, opts.page ?? 1);
  const perPage = opts.perPage ?? 12;
  const where = publicWhere(opts);
  const [items, total] = await Promise.all([
    prisma.resource.findMany({
      where,
      orderBy: [{ featured: "desc" }, { publishedAt: "desc" }],
      skip: (page - 1) * perPage,
      take: perPage,
      select: PUBLIC_CARD_SELECT,
    }),
    prisma.resource.count({ where }),
  ]);
  return { items, total, page, perPage, pages: Math.max(1, Math.ceil(total / perPage)) };
}

export async function listAdminResources(opts: { status?: string; type?: string; q?: string; page?: number }) {
  const page = Math.max(1, opts.page ?? 1);
  const perPage = 20;
  const where: Prisma.ResourceWhereInput = {
    deletedAt: null,
    ...(opts.status && { status: opts.status as Prisma.ResourceWhereInput["status"] }),
    ...(opts.type && { type: opts.type as Prisma.ResourceWhereInput["type"] }),
    ...(opts.q && { title: { contains: opts.q, mode: "insensitive" } }),
  };
  const [items, total] = await Promise.all([
    prisma.resource.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
      select: {
        id: true,
        title: true,
        slug: true,
        type: true,
        access: true,
        pricePaise: true,
        status: true,
        downloadCount: true,
        ratingCount: true,
        updatedAt: true,
        category: { select: { name: true } },
        _count: { select: { purchases: true } },
      },
    }),
    prisma.resource.count({ where }),
  ]);
  return { items, total, page, perPage, pages: Math.max(1, Math.ceil(total / perPage)) };
}

export async function getFeaturedResources(limit = 8): Promise<ResourceCard[]> {
  return prisma.resource.findMany({
    where: { status: ResourceStatus.PUBLISHED, deletedAt: null, featured: true },
    orderBy: { publishedAt: "desc" },
    take: limit,
    select: PUBLIC_CARD_SELECT,
  });
}

export async function getPublishedResourceSlugs(): Promise<string[]> {
  const rows = await prisma.resource.findMany({
    where: { status: ResourceStatus.PUBLISHED, deletedAt: null },
    select: { slug: true },
    take: 1000,
  });
  return rows.map((r) => r.slug);
}

// ─────────────────────────── Research / Thesis library ───────────────────────────

const RESEARCH_CARD_SELECT = {
  id: true,
  title: true,
  slug: true,
  type: true,
  access: true,
  pricePaise: true,
  excerpt: true,
  abstract: true,
  author: true,
  doi: true,
  publishedYear: true,
  previewImages: true,
  downloadCount: true,
  ratingSum: true,
  ratingCount: true,
  publishedAt: true,
  category: { select: { name: true, slug: true } },
} satisfies Prisma.ResourceSelect;

export type ResearchCard = Prisma.ResourceGetPayload<{ select: typeof RESEARCH_CARD_SELECT }>;

export interface ResearchListOpts {
  year?: number;
  categoryId?: string;
  q?: string;
  page?: number;
  perPage?: number;
}

export async function listResearchResources(opts: ResearchListOpts) {
  const page = Math.max(1, opts.page ?? 1);
  const perPage = opts.perPage ?? 12;
  const where: Prisma.ResourceWhereInput = {
    status: ResourceStatus.PUBLISHED,
    deletedAt: null,
    type: { in: RESEARCH_RESOURCE_TYPES },
    ...(opts.year && { publishedYear: opts.year }),
    ...(opts.categoryId && { categoryId: opts.categoryId }),
    ...(opts.q && {
      OR: [
        { title: { contains: opts.q, mode: "insensitive" } },
        { abstract: { contains: opts.q, mode: "insensitive" } },
        { author: { contains: opts.q, mode: "insensitive" } },
      ],
    }),
  };
  const [items, total] = await Promise.all([
    prisma.resource.findMany({
      where,
      orderBy: [{ publishedYear: { sort: "desc", nulls: "last" } }, { publishedAt: "desc" }],
      skip: (page - 1) * perPage,
      take: perPage,
      select: RESEARCH_CARD_SELECT,
    }),
    prisma.resource.count({ where }),
  ]);
  return { items, total, page, perPage, pages: Math.max(1, Math.ceil(total / perPage)) };
}

/** Distinct publication years present in the library (for the year filter). */
export async function getResearchYears(): Promise<number[]> {
  const rows = await prisma.resource.findMany({
    where: {
      status: ResourceStatus.PUBLISHED,
      deletedAt: null,
      type: { in: RESEARCH_RESOURCE_TYPES },
      publishedYear: { not: null },
    },
    select: { publishedYear: true },
    distinct: ["publishedYear"],
    orderBy: { publishedYear: "desc" },
  });
  return rows.map((r) => r.publishedYear).filter((y): y is number => y != null);
}

export async function getResourceBySlug(slug: string) {
  return prisma.resource.findFirst({
    where: { slug, status: ResourceStatus.PUBLISHED, deletedAt: null },
    include: {
      category: { select: { name: true, slug: true } },
      tags: { include: { tag: { select: { name: true, slug: true } } } },
    },
  });
}

export async function getResourceForEdit(id: string) {
  return prisma.resource.findUnique({
    where: { id },
    include: {
      tags: { include: { tag: { select: { name: true } } } },
      file: { select: { id: true, fileName: true, size: true } },
    },
  });
}

export async function incrementView(id: string) {
  await prisma.resource.update({ where: { id }, data: { viewCount: { increment: 1 } } }).catch(() => {});
}

export async function incrementDownload(id: string) {
  await prisma.resource.update({ where: { id }, data: { downloadCount: { increment: 1 } } }).catch(() => {});
}

/** Resource + its protected file, for the secure download route. */
export async function getResourceWithFile(slug: string) {
  return prisma.resource.findFirst({
    where: { slug, status: ResourceStatus.PUBLISHED, deletedAt: null },
    select: {
      id: true,
      slug: true,
      title: true,
      access: true,
      file: { select: { publicId: true, fileName: true } },
    },
  });
}

/** Entitlement: FREE → always; PAID → a PAID purchase by this buyer/email; PREMIUM → false (P1). */
export async function hasEntitlement(opts: {
  resourceId: string;
  access: ResourceAccess;
  buyerId?: string | null;
  email?: string | null;
}): Promise<boolean> {
  if (opts.access === ResourceAccess.FREE) return true;
  // An active PREMIUM membership is all-access: it unlocks every PAID and PREMIUM resource.
  if (await hasActiveMembership(opts.buyerId, opts.email)) return true;
  // No membership → PREMIUM resources stay locked (members-only).
  if (opts.access === ResourceAccess.PREMIUM) return false;
  // Buyer-identity clauses shared by both purchase tables (id or email).
  const ors: { buyerId?: string; email?: string }[] = [];
  if (opts.buyerId) ors.push({ buyerId: opts.buyerId });
  if (opts.email) ors.push({ email: opts.email.toLowerCase() });
  if (ors.length === 0) return false;
  // Direct single-resource purchase…
  const paid = await prisma.resourcePurchase.findFirst({
    where: { resourceId: opts.resourceId, status: "PAID", OR: ors },
    select: { id: true },
  });
  if (paid) return true;
  // …or a PAID bundle that contains this resource.
  const bundled = await prisma.bundlePurchase.findFirst({
    where: { status: "PAID", OR: ors, bundle: { items: { some: { resourceId: opts.resourceId } } } },
    select: { id: true },
  });
  return Boolean(bundled);
}

/** Published resources selectable when composing a bundle (admin). */
export async function listSelectableResources() {
  return prisma.resource.findMany({
    where: { status: ResourceStatus.PUBLISHED, deletedAt: null },
    orderBy: { title: "asc" },
    take: 500,
    select: { id: true, title: true, type: true, access: true, pricePaise: true },
  });
}

export async function listBuyerDownloads(buyerId: string, email: string, limit = 25) {
  return prisma.resourceDownload.findMany({
    where: { OR: [{ buyerId }, { email: email.toLowerCase() }] },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      createdAt: true,
      resource: { select: { title: true, slug: true } },
    },
  });
}

export async function hasDownloaded(resourceId: string, buyerId: string, email: string): Promise<boolean> {
  const row = await prisma.resourceDownload.findFirst({
    where: { resourceId, OR: [{ buyerId }, { email: email.toLowerCase() }] },
    select: { id: true },
  });
  return Boolean(row);
}

export async function recordDownload(opts: {
  resourceId: string;
  buyerId?: string | null;
  email?: string | null;
  ip?: string | null;
}) {
  await prisma.resourceDownload
    .create({
      data: {
        resourceId: opts.resourceId,
        buyerId: opts.buyerId || null,
        email: opts.email?.toLowerCase() || null,
        ip: opts.ip || null,
      },
    })
    .catch(() => {});
}
