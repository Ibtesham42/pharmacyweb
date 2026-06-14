import { BookOpen } from "lucide-react";
import { listPosts } from "@/services/posts";
import { PostCard } from "@/components/public/post-card";
import { Pagination } from "@/components/public/pagination";
import { EmptyState } from "@/components/public/empty-state";
import { Breadcrumbs } from "@/components/public/breadcrumbs";
import { AdSlot } from "@/components/ads/ad-slot";
import { buildMetadata } from "@/lib/seo";
import { safe } from "@/lib/utils";

export const revalidate = 300;

export const metadata = buildMetadata({
  title: "Pharmacy Articles, Guides & Study Material",
  path: "/articles",
  description:
    "Read articles, career guides and study material for pharmacy and medical professionals and students in India.",
});

export default async function ArticlesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page } = await searchParams;
  const result = await safe(listPosts({ type: "ARTICLE", page: Number(page ?? 1) }), {
    items: [],
    total: 0,
    page: 1,
    perPage: 12,
    pages: 1,
  });

  return (
    <div className="container py-8">
      <Breadcrumbs items={[{ name: "Home", path: "/" }, { name: "Articles", path: "/articles" }]} />
      <header className="mb-6 mt-3">
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight sm:text-3xl">
          <BookOpen className="h-7 w-7 text-primary" /> Articles & Guides
        </h1>
        <p className="mt-1 text-muted-foreground">{result.total} articles</p>
      </header>

      <AdSlot slot="HOMEPAGE_TOP" />

      {result.items.length === 0 ? (
        <EmptyState title="No articles yet" description="Check back soon for new content." />
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
        buildHref={(p) => `/articles?page=${p}`}
      />
    </div>
  );
}
