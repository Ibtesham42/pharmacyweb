import Link from "next/link";
import { Package, Store } from "lucide-react";
import { Breadcrumbs } from "@/components/public/breadcrumbs";
import { BundleCard } from "@/components/public/bundle-card";
import { Pagination } from "@/components/public/pagination";
import { EmptyState } from "@/components/public/empty-state";
import { JsonLd } from "@/components/seo/json-ld";
import { Button } from "@/components/ui/button";
import { listBundles } from "@/services/bundles";
import { getMarketplaceSettings } from "@/services/marketplace-settings";
import { DEFAULT_MARKETPLACE_SETTINGS } from "@/lib/marketplace/config";
import { buildMetadata, breadcrumbJsonLd } from "@/lib/seo";
import { safe } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: "Exam-Prep Bundles — GPAT, NIPER & Drug Inspector Packs",
  path: "/exam-prep",
  description:
    "Save with curated exam-prep bundles — notes, previous-year papers, mock tests and study guides packaged together for GPAT, NIPER, Drug Inspector and pharmacy exams.",
});

export default async function ExamPrepPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const settings = await safe(getMarketplaceSettings(), DEFAULT_MARKETPLACE_SETTINGS);

  if (!settings.enabled) {
    return (
      <div className="container max-w-2xl py-16 text-center">
        <Package className="mx-auto h-10 w-10 text-primary" />
        <h1 className="mt-3 text-2xl font-bold">Exam-Prep Bundles</h1>
        <p className="mt-2 text-muted-foreground">
          The store isn’t open yet. Please check back soon for exam-prep bundles.
        </p>
      </div>
    );
  }

  const result = await safe(listBundles({ q: sp.q, page: Number(sp.page ?? 1) }), {
    items: [],
    total: 0,
    page: 1,
    perPage: 12,
    pages: 1,
  });

  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Exam Prep", path: "/exam-prep" },
  ];
  const buildHref = (page: number) => {
    const params = new URLSearchParams();
    if (sp.q) params.set("q", sp.q);
    params.set("page", String(page));
    return `/exam-prep?${params.toString()}`;
  };

  return (
    <div className="container py-8">
      <JsonLd data={breadcrumbJsonLd(crumbs)} />
      <Breadcrumbs items={crumbs} />

      <header className="mb-6 mt-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold sm:text-3xl">
            <Package className="h-7 w-7 text-primary" /> Exam-Prep Bundles
          </h1>
          <p className="mt-1 text-muted-foreground">
            Curated packs — notes, papers, mock tests &amp; guides bundled together at a saving.
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/store">
            <Store className="h-4 w-4" /> All resources
          </Link>
        </Button>
      </header>

      <section>
        {result.items.length === 0 ? (
          <EmptyState title="No bundles yet" description="Check back soon — exam-prep bundles are on the way." />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {result.items.map((b) => (
              <BundleCard key={b.id} bundle={b} />
            ))}
          </div>
        )}
        <Pagination page={result.page} pages={result.pages} buildHref={buildHref} />
      </section>
    </div>
  );
}
