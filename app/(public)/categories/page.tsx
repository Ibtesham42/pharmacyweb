import Link from "next/link";
import { Tag } from "lucide-react";
import { listPublicCategories } from "@/services/categories";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/public/empty-state";
import { Breadcrumbs } from "@/components/public/breadcrumbs";
import { buildMetadata } from "@/lib/seo";
import { safe } from "@/lib/utils";

export const revalidate = 600;

export const metadata = buildMetadata({
  title: "Browse Categories",
  path: "/categories",
  description: "Browse pharmacy and medical jobs, news and articles by category.",
});

export default async function CategoriesPage() {
  const categories = await safe(listPublicCategories(), []);

  return (
    <div className="container py-8">
      <Breadcrumbs items={[{ name: "Home", path: "/" }, { name: "Categories", path: "/categories" }]} />
      <header className="mb-6 mt-3">
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight sm:text-3xl">
          <Tag className="h-7 w-7 text-primary" /> Categories
        </h1>
      </header>

      {categories.length === 0 ? (
        <EmptyState title="No categories yet" />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((c) => (
            <Link
              key={c.id}
              href={`/categories/${c.slug}`}
              className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:border-primary hover:bg-accent/50"
            >
              <div>
                <span className="font-medium">{c.name}</span>
                {c.description && (
                  <p className="line-clamp-1 text-sm text-muted-foreground">{c.description}</p>
                )}
              </div>
              <Badge variant="secondary">{c._count.posts}</Badge>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
