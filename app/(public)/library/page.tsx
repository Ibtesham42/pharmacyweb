import Link from "next/link";
import { GraduationCap, Store } from "lucide-react";
import { Breadcrumbs } from "@/components/public/breadcrumbs";
import { ResearchCard } from "@/components/public/research-card";
import { ResearchFilters } from "@/components/public/research-filters";
import { Pagination } from "@/components/public/pagination";
import { EmptyState } from "@/components/public/empty-state";
import { JsonLd } from "@/components/seo/json-ld";
import { Button } from "@/components/ui/button";
import { listResearchResources, getResearchYears } from "@/services/resources";
import { listPublicResourceCategories } from "@/services/resource-categories";
import { getMarketplaceSettings } from "@/services/marketplace-settings";
import { DEFAULT_MARKETPLACE_SETTINGS } from "@/lib/marketplace/config";
import { buildMetadata, breadcrumbJsonLd } from "@/lib/seo";
import { safe } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: "Thesis & Research Library — Pharmacy Papers, Theses & Dissertations",
  path: "/library",
  description:
    "Browse pharmacy and medical research papers, theses and dissertations — with abstracts, citations and DOIs. Free and paid downloads for students, researchers and academics in India.",
});

export default async function LibraryPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; category?: string; q?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const settings = await safe(getMarketplaceSettings(), DEFAULT_MARKETPLACE_SETTINGS);

  if (!settings.enabled) {
    return (
      <div className="container max-w-2xl py-16 text-center">
        <GraduationCap className="mx-auto h-10 w-10 text-primary" />
        <h1 className="mt-3 text-2xl font-bold">Research Library</h1>
        <p className="mt-2 text-muted-foreground">
          The library isn’t open yet. Please check back soon for research papers and theses.
        </p>
      </div>
    );
  }

  const yearNum = sp.year ? Number(sp.year) : undefined;
  const [result, years, categories] = await Promise.all([
    safe(
      listResearchResources({
        year: Number.isFinite(yearNum) ? yearNum : undefined,
        categoryId: sp.category,
        q: sp.q,
        page: Number(sp.page ?? 1),
      }),
      { items: [], total: 0, page: 1, perPage: 12, pages: 1 },
    ),
    safe(getResearchYears(), []),
    safe(listPublicResourceCategories(), []),
  ]);

  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Research Library", path: "/library" },
  ];
  const buildHref = (page: number) => {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(sp)) if (v && k !== "page") params.set(k, v);
    params.set("page", String(page));
    return `/library?${params.toString()}`;
  };

  return (
    <div className="container py-8">
      <JsonLd data={breadcrumbJsonLd(crumbs)} />
      <Breadcrumbs items={crumbs} />

      <header className="mb-6 mt-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold sm:text-3xl">
            <GraduationCap className="h-7 w-7 text-primary" /> Thesis &amp; Research Library
          </h1>
          <p className="mt-1 text-muted-foreground">
            Pharmacy &amp; medical research papers, theses and dissertations — with abstracts, citations and DOIs.
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/store">
            <Store className="h-4 w-4" /> All resources
          </Link>
        </Button>
      </header>

      <div className="mb-6">
        <ResearchFilters years={years} categories={categories.map((c) => ({ id: c.id, name: c.name }))} />
      </div>

      <section>
        <p className="mb-3 text-sm text-muted-foreground">
          {result.total} {result.total === 1 ? "item" : "items"}
        </p>
        {result.items.length === 0 ? (
          <EmptyState
            title="No research found"
            description="Try clearing filters or searching different keywords."
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {result.items.map((r) => (
              <ResearchCard key={r.id} resource={r} />
            ))}
          </div>
        )}
        <Pagination page={result.page} pages={result.pages} buildHref={buildHref} />
      </section>
    </div>
  );
}
