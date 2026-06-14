import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { listPosts } from "@/services/posts";
import { getCategoryBySlug } from "@/services/categories";
import { PostCard } from "@/components/public/post-card";
import { Pagination } from "@/components/public/pagination";
import { EmptyState } from "@/components/public/empty-state";
import { Breadcrumbs } from "@/components/public/breadcrumbs";
import { AdSlot } from "@/components/ads/ad-slot";
import { JsonLd } from "@/components/seo/json-ld";
import { buildMetadata, breadcrumbJsonLd } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) return { title: "Category not found" };
  return buildMetadata({
    title: `${category.name} — Jobs, News & Articles`,
    description: category.description || `Latest ${category.name} content for pharmacy and medical professionals.`,
    path: `/categories/${category.slug}`,
  });
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { slug } = await params;
  const { page } = await searchParams;
  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  const result = await listPosts({ categorySlug: slug, page: Number(page ?? 1) });
  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Categories", path: "/categories" },
    { name: category.name, path: `/categories/${category.slug}` },
  ];

  return (
    <div className="container py-8">
      <JsonLd data={breadcrumbJsonLd(crumbs)} />
      <Breadcrumbs items={crumbs} />
      <header className="mb-6 mt-3">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{category.name}</h1>
        {category.description && <p className="mt-1 text-muted-foreground">{category.description}</p>}
      </header>

      <AdSlot slot="HOMEPAGE_TOP" />

      {result.items.length === 0 ? (
        <EmptyState title="No content in this category yet" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {result.items.map((p) => (
            <PostCard key={p.id} post={p} />
          ))}
        </div>
      )}

      <Pagination
        page={result.page}
        pages={result.pages}
        buildHref={(p) => `/categories/${slug}?page=${p}`}
      />
    </div>
  );
}
