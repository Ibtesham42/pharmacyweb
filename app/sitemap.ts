import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { absoluteUrl } from "@/lib/site";
import { postPath } from "@/lib/format";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    "",
    "/jobs",
    "/articles",
    "/news",
    "/store",
    "/library",
    "/exam-prep",
    "/categories",
    "/search",
    "/about",
    "/contact",
    "/advertise",
    "/privacy",
    "/terms",
  ].map((path) => ({
    url: absoluteUrl(path || "/"),
    lastModified: new Date(),
    changeFrequency: path === "" ? "daily" : "weekly",
    priority: path === "" ? 1 : 0.7,
  }));

  const [posts, categories, resources, bundles] = await Promise.all([
    prisma.post.findMany({
      where: { deletedAt: null, status: "PUBLISHED" },
      select: { type: true, slug: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
      take: 5000,
    }),
    prisma.category.findMany({ select: { slug: true } }),
    prisma.resource.findMany({
      where: { deletedAt: null, status: "PUBLISHED" },
      select: { slug: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
      take: 5000,
    }),
    prisma.bundle.findMany({
      where: { deletedAt: null, status: "PUBLISHED" },
      select: { slug: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
      take: 2000,
    }),
  ]).catch(() => [[], [], [], []] as const);

  const postRoutes: MetadataRoute.Sitemap = posts.map((p) => ({
    url: absoluteUrl(postPath(p.type, p.slug)),
    lastModified: p.updatedAt,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const categoryRoutes: MetadataRoute.Sitemap = categories.map((c) => ({
    url: absoluteUrl(`/categories/${c.slug}`),
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  const resourceRoutes: MetadataRoute.Sitemap = resources.map((r) => ({
    url: absoluteUrl(`/store/${r.slug}`),
    lastModified: r.updatedAt,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const bundleRoutes: MetadataRoute.Sitemap = bundles.map((b) => ({
    url: absoluteUrl(`/exam-prep/${b.slug}`),
    lastModified: b.updatedAt,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  return [...staticRoutes, ...postRoutes, ...categoryRoutes, ...resourceRoutes, ...bundleRoutes];
}
