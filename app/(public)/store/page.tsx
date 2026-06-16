import Link from "next/link";
import { Store, UserRound, Sparkles } from "lucide-react";
import { Breadcrumbs } from "@/components/public/breadcrumbs";
import { ResourceCard } from "@/components/public/resource-card";
import { ResourceFilters } from "@/components/public/resource-filters";
import { Pagination } from "@/components/public/pagination";
import { EmptyState } from "@/components/public/empty-state";
import { Button } from "@/components/ui/button";
import { listResources, getFeaturedResources } from "@/services/resources";
import { listPublicResourceCategories } from "@/services/resource-categories";
import { getMarketplaceSettings } from "@/services/marketplace-settings";
import { DEFAULT_MARKETPLACE_SETTINGS } from "@/lib/marketplace/config";
import { buildMetadata } from "@/lib/seo";
import { safe } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: "Resources Store — Pharmacy Notes, PYQs, GPAT & Mock Tests",
  path: "/store",
  description:
    "Download pharmacy study notes, previous year papers, GPAT & NIPER material, mock tests, e-books and research — free and paid resources for students and professionals.",
});

export default async function StorePage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; category?: string; access?: string; q?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const settings = await safe(getMarketplaceSettings(), DEFAULT_MARKETPLACE_SETTINGS);

  if (!settings.enabled) {
    return (
      <div className="container max-w-2xl py-16 text-center">
        <Store className="mx-auto h-10 w-10 text-primary" />
        <h1 className="mt-3 text-2xl font-bold">Resources Store</h1>
        <p className="mt-2 text-muted-foreground">
          The store isn’t open yet. Please check back soon for pharmacy notes, papers and study material.
        </p>
      </div>
    );
  }

  const isFiltered = Boolean(sp.type || sp.category || sp.access || sp.q);
  const [result, featured, categories] = await Promise.all([
    safe(listResources({ ...sp, page: Number(sp.page ?? 1) }), { items: [], total: 0, page: 1, perPage: 12, pages: 1 }),
    isFiltered ? Promise.resolve([]) : safe(getFeaturedResources(settings.featuredCount), []),
    safe(listPublicResourceCategories(), []),
  ]);

  const buildHref = (page: number) => {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(sp)) if (v && k !== "page") params.set(k, v);
    params.set("page", String(page));
    return `/store?${params.toString()}`;
  };

  return (
    <div className="container py-8">
      <Breadcrumbs items={[{ name: "Home", path: "/" }, { name: "Store", path: "/store" }]} />

      <header className="mb-6 mt-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold sm:text-3xl">
            <Store className="h-7 w-7 text-primary" /> Resources Store
          </h1>
          <p className="mt-1 text-muted-foreground">
            Notes, previous-year papers, GPAT/NIPER material, mock tests, e-books & research.
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/account">
            <UserRound className="h-4 w-4" /> My account
          </Link>
        </Button>
      </header>

      <div className="mb-6">
        <ResourceFilters categories={categories.map((c) => ({ id: c.id, name: c.name }))} />
      </div>

      {!isFiltered && featured.length > 0 && (
        <section className="mb-10">
          <h2 className="mb-3 flex items-center gap-2 text-lg font-bold">
            <Sparkles className="h-5 w-5 text-primary" /> Featured
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((r) => (
              <ResourceCard key={r.id} resource={r} />
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-3 text-lg font-bold">{isFiltered ? "Results" : "All resources"}</h2>
        {result.items.length === 0 ? (
          <EmptyState title="No resources found" description="Try clearing filters or searching different keywords." />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {result.items.map((r) => (
              <ResourceCard key={r.id} resource={r} />
            ))}
          </div>
        )}
        <Pagination page={result.page} pages={result.pages} buildHref={buildHref} />
      </section>
    </div>
  );
}
