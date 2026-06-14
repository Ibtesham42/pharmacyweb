import { EventType, PostType } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export interface EventInput {
  type: EventType;
  path?: string;
  postId?: string;
  adId?: string;
  query?: string;
  referrer?: string;
  sessionId?: string;
  country?: string;
  userAgent?: string;
}

/** Record a first-party analytics event (best-effort, never throws). */
export async function recordEvent(input: EventInput) {
  try {
    await prisma.analyticsEvent.create({ data: input });
  } catch (err) {
    console.error("analytics event failed", err);
  }
}

export async function getDashboardStats() {
  const since = new Date(Date.now() - 1000 * 60 * 60 * 24 * 30);

  const [
    totalPosts,
    totalJobs,
    totalArticles,
    totalNews,
    pageViews30d,
    mostViewed,
    topCategories,
    recentSearches,
    adAgg,
    activeJobs,
  ] = await Promise.all([
    prisma.post.count({ where: { deletedAt: null } }),
    prisma.post.count({ where: { deletedAt: null, type: PostType.JOB } }),
    prisma.post.count({ where: { deletedAt: null, type: PostType.ARTICLE } }),
    prisma.post.count({ where: { deletedAt: null, type: PostType.NEWS } }),
    prisma.analyticsEvent.count({ where: { type: EventType.PAGE_VIEW, createdAt: { gte: since } } }),
    prisma.post.findMany({
      where: { deletedAt: null, status: "PUBLISHED" },
      select: { id: true, title: true, slug: true, type: true, viewCount: true },
      orderBy: { viewCount: "desc" },
      take: 5,
    }),
    prisma.category.findMany({
      select: { name: true, slug: true, _count: { select: { posts: true } } },
      orderBy: { posts: { _count: "desc" } },
      take: 5,
    }),
    prisma.analyticsEvent.groupBy({
      by: ["query"],
      where: { type: EventType.SEARCH, query: { not: null } },
      _count: { query: true },
      orderBy: { _count: { query: "desc" } },
      take: 10,
    }),
    prisma.advertisement.aggregate({ _sum: { impressions: true, clicks: true } }),
    prisma.post.count({
      where: {
        deletedAt: null,
        type: PostType.JOB,
        status: "PUBLISHED",
        jobDetail: { OR: [{ expiryDate: null }, { expiryDate: { gte: new Date() } }] },
      },
    }),
  ]);

  return {
    totals: { posts: totalPosts, jobs: totalJobs, articles: totalArticles, news: totalNews, activeJobs },
    pageViews30d,
    mostViewed,
    topCategories: topCategories.map((c) => ({ name: c.name, slug: c.slug, count: c._count.posts })),
    recentSearches: recentSearches.map((s) => ({ query: s.query, count: s._count.query })),
    ads: { impressions: adAgg._sum.impressions ?? 0, clicks: adAgg._sum.clicks ?? 0 },
  };
}
