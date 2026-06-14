import { Prisma, PostStatus, PostType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { toSlug, uniqueSlug } from "@/lib/slug";
import type { PostInput } from "@/lib/validation";

// ─────────────────────────── Includes & types ───────────────────────────
export const postCardInclude = {
  featuredImage: true,
  category: true,
  jobDetail: true,
} satisfies Prisma.PostInclude;

export const postDetailInclude = {
  author: { select: { name: true } },
  category: true,
  featuredImage: true,
  jobDetail: true,
  seo: true,
  references: true,
  tags: { include: { tag: true } },
  gallery: { include: { media: true }, orderBy: { position: "asc" } },
} satisfies Prisma.PostInclude;

export type PostCard = Prisma.PostGetPayload<{ include: typeof postCardInclude }>;
export type PostDetail = Prisma.PostGetPayload<{ include: typeof postDetailInclude }>;

const PER_PAGE = 12;

/** WHERE clause for content visible to the public (published, or scheduled and due). */
function visibleWhere(): Prisma.PostWhereInput {
  return {
    deletedAt: null,
    OR: [
      { status: PostStatus.PUBLISHED },
      { status: PostStatus.SCHEDULED, scheduledAt: { lte: new Date() } },
    ],
  };
}

// ─────────────────────────── Public reads ───────────────────────────
export async function listPosts(opts: {
  type?: PostType;
  page?: number;
  perPage?: number;
  categorySlug?: string;
  tagSlug?: string;
  featured?: boolean;
}) {
  const page = Math.max(1, opts.page ?? 1);
  const perPage = opts.perPage ?? PER_PAGE;

  const where: Prisma.PostWhereInput = {
    ...visibleWhere(),
    ...(opts.type && { type: opts.type }),
    ...(opts.categorySlug && { category: { slug: opts.categorySlug } }),
    ...(opts.tagSlug && { tags: { some: { tag: { slug: opts.tagSlug } } } }),
    ...(opts.featured && { isFeatured: true }),
  };

  const [items, total] = await Promise.all([
    prisma.post.findMany({
      where,
      include: postCardInclude,
      orderBy: [{ isFeatured: "desc" }, { publishedAt: "desc" }],
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.post.count({ where }),
  ]);

  return { items, total, page, perPage, pages: Math.max(1, Math.ceil(total / perPage)) };
}

export async function getFeatured(limit = 6) {
  return prisma.post.findMany({
    where: { ...visibleWhere(), isFeatured: true },
    include: postCardInclude,
    orderBy: { publishedAt: "desc" },
    take: limit,
  });
}

export async function getLatest(type: PostType, limit = 6) {
  return prisma.post.findMany({
    where: { ...visibleWhere(), type },
    include: postCardInclude,
    orderBy: { publishedAt: "desc" },
    take: limit,
  });
}

export async function getPublishedPostBySlug(slug: string): Promise<PostDetail | null> {
  const post = await prisma.post.findUnique({ where: { slug }, include: postDetailInclude });
  if (!post || post.deletedAt) return null;
  const visible =
    post.status === PostStatus.PUBLISHED ||
    (post.status === PostStatus.SCHEDULED && post.scheduledAt && post.scheduledAt <= new Date());
  return visible ? post : null;
}

export async function getRelated(post: { id: string; categoryId: string | null; type: PostType }, limit = 4) {
  return prisma.post.findMany({
    where: {
      ...visibleWhere(),
      id: { not: post.id },
      OR: [
        ...(post.categoryId ? [{ categoryId: post.categoryId }] : []),
        { type: post.type },
      ],
    },
    include: postCardInclude,
    orderBy: { publishedAt: "desc" },
    take: limit,
  });
}

/** Fire-and-forget view increment. */
export async function incrementViewCount(id: string) {
  await prisma.post.update({ where: { id }, data: { viewCount: { increment: 1 } } }).catch(() => {});
}

// ─────────────────────────── Admin reads ───────────────────────────
export async function listAllPosts(opts: {
  type?: PostType;
  status?: PostStatus;
  q?: string;
  page?: number;
}) {
  const page = Math.max(1, opts.page ?? 1);
  const perPage = 20;
  const where: Prisma.PostWhereInput = {
    deletedAt: null,
    ...(opts.type && { type: opts.type }),
    ...(opts.status && { status: opts.status }),
    ...(opts.q && { title: { contains: opts.q, mode: "insensitive" } }),
  };
  const [items, total] = await Promise.all([
    prisma.post.findMany({
      where,
      include: { category: true, jobDetail: { select: { companyName: true } } },
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.post.count({ where }),
  ]);
  return { items, total, page, perPage, pages: Math.max(1, Math.ceil(total / perPage)) };
}

export async function getPostForEdit(id: string) {
  return prisma.post.findUnique({ where: { id }, include: postDetailInclude });
}

// ─────────────────────────── Helpers ───────────────────────────
const blank = (v?: string | null) => (v && v.length ? v : undefined);

function mapSeo(seo: NonNullable<PostInput["seo"]>) {
  return {
    metaTitle: blank(seo.metaTitle),
    metaDescription: blank(seo.metaDescription),
    canonicalUrl: blank(seo.canonicalUrl),
    ogTitle: blank(seo.ogTitle),
    ogDescription: blank(seo.ogDescription),
    ogImageUrl: blank(seo.ogImageUrl),
    keywords: seo.keywords ?? [],
    noindex: seo.noindex ?? false,
  };
}

function mapJob(job: NonNullable<PostInput["jobDetail"]>) {
  return {
    companyName: job.companyName,
    companyWebsite: blank(job.companyWebsite),
    city: blank(job.city),
    state: blank(job.state),
    jobType: job.jobType,
    salaryMin: job.salaryMin ?? null,
    salaryMax: job.salaryMax ?? null,
    salaryText: blank(job.salaryText),
    currency: "INR",
    applyUrl: job.applyUrl,
    experienceLevel: blank(job.experienceLevel),
    qualifications: blank(job.qualifications),
    expiryDate: job.expiryDate ?? null,
  };
}

async function upsertTagIds(names: string[], tx: Prisma.TransactionClient) {
  const ids: string[] = [];
  for (const name of names) {
    const slug = toSlug(name);
    if (!slug) continue;
    const tag = await tx.tag.upsert({ where: { slug }, update: {}, create: { name, slug } });
    ids.push(tag.id);
  }
  return ids;
}

function publishFields(status: PostStatus, scheduledAt?: Date, existingPublishedAt?: Date | null) {
  if (status === PostStatus.PUBLISHED) {
    return { publishedAt: existingPublishedAt ?? new Date(), scheduledAt: null };
  }
  if (status === PostStatus.SCHEDULED) {
    return { scheduledAt: scheduledAt ?? null, publishedAt: existingPublishedAt ?? null };
  }
  return { scheduledAt: null }; // DRAFT / ARCHIVED keep publishedAt as-is
}

// ─────────────────────────── Admin writes ───────────────────────────
export async function createPost(input: PostInput, authorId: string) {
  const slug = await uniqueSlug(input.slug || input.title, (s) =>
    prisma.post.findUnique({ where: { slug: s }, select: { id: true } }).then(Boolean),
  );

  return prisma.$transaction(async (tx) => {
    const post = await tx.post.create({
      data: {
        type: input.type,
        title: input.title,
        slug,
        excerpt: blank(input.excerpt),
        content: input.content,
        status: input.status,
        isFeatured: input.isFeatured,
        authorId,
        categoryId: blank(input.categoryId),
        featuredImageId: blank(input.featuredImageId),
        ...publishFields(input.status, input.scheduledAt),
        ...(input.references.length ? { references: { create: input.references } } : {}),
        ...(input.seo ? { seo: { create: mapSeo(input.seo) } } : {}),
        ...(input.type === PostType.JOB && input.jobDetail
          ? { jobDetail: { create: mapJob(input.jobDetail) } }
          : {}),
      },
    });

    const tagIds = await upsertTagIds(input.tags, tx);
    if (tagIds.length) {
      await tx.postTag.createMany({ data: tagIds.map((tagId) => ({ postId: post.id, tagId })) });
    }
    return post;
  });
}

export async function updatePost(id: string, input: PostInput) {
  const existing = await prisma.post.findUnique({ where: { id }, select: { publishedAt: true } });
  if (!existing) throw new Error("NOT_FOUND");

  const slug = await uniqueSlug(input.slug || input.title, async (s) => {
    const found = await prisma.post.findUnique({ where: { slug: s }, select: { id: true } });
    return !!found && found.id !== id;
  });

  return prisma.$transaction(async (tx) => {
    await tx.reference.deleteMany({ where: { postId: id } });
    await tx.postTag.deleteMany({ where: { postId: id } });

    const post = await tx.post.update({
      where: { id },
      data: {
        type: input.type,
        title: input.title,
        slug,
        excerpt: blank(input.excerpt) ?? null,
        content: input.content,
        status: input.status,
        isFeatured: input.isFeatured,
        categoryId: blank(input.categoryId) ?? null,
        featuredImageId: blank(input.featuredImageId) ?? null,
        ...publishFields(input.status, input.scheduledAt, existing.publishedAt),
        ...(input.references.length
          ? { references: { create: input.references } }
          : {}),
        seo: input.seo
          ? { upsert: { create: mapSeo(input.seo), update: mapSeo(input.seo) } }
          : undefined,
        jobDetail:
          input.type === PostType.JOB && input.jobDetail
            ? { upsert: { create: mapJob(input.jobDetail), update: mapJob(input.jobDetail) } }
            : undefined,
      },
    });

    const tagIds = await upsertTagIds(input.tags, tx);
    if (tagIds.length) {
      await tx.postTag.createMany({ data: tagIds.map((tagId) => ({ postId: id, tagId })) });
    }
    return post;
  });
}

/** Soft delete — keeps the row but hides it from all public/admin lists. */
export async function softDeletePost(id: string) {
  return prisma.post.update({ where: { id }, data: { deletedAt: new Date() } });
}

export async function setPostStatus(id: string, status: PostStatus) {
  const existing = await prisma.post.findUnique({ where: { id }, select: { publishedAt: true } });
  return prisma.post.update({
    where: { id },
    data: { status, ...publishFields(status, undefined, existing?.publishedAt) },
  });
}
