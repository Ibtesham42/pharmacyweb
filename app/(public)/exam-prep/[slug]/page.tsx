import { cache } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { Package, Download, FileText, Check } from "lucide-react";
import { getBundleBySlug, incrementBundleView } from "@/services/bundles";
import { hasBundlePurchase } from "@/services/bundle-purchases";
import { getMarketplaceSettings } from "@/services/marketplace-settings";
import { getCurrentBuyer } from "@/lib/buyer-session";
import { isRazorpayConfigured } from "@/lib/razorpay";
import { Breadcrumbs } from "@/components/public/breadcrumbs";
import { Markdown } from "@/components/markdown";
import { JsonLd } from "@/components/seo/json-ld";
import { ResourcePurchaseForm } from "@/components/public/resource-purchase-form";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatINR } from "@/lib/format";
import { RESOURCE_TYPE_LABELS } from "@/lib/marketplace/config";
import { buildMetadata, bundleJsonLd, breadcrumbJsonLd } from "@/lib/seo";

export const dynamic = "force-dynamic";

const getBundle = cache((slug: string) => getBundleBySlug(slug));

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const b = await getBundle(slug);
  if (!b) return { title: "Bundle not found" };
  return buildMetadata({
    title: b.metaTitle || b.title,
    description: b.metaDescription || b.excerpt || undefined,
    path: `/exam-prep/${b.slug}`,
    image: b.ogImageUrl || b.coverImage || b.previewImages[0],
    type: "article",
  });
}

export default async function BundleDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const b = await getBundle(slug);
  if (!b) notFound();

  const [settings, buyer] = await Promise.all([getMarketplaceSettings(), getCurrentBuyer()]);
  const owned = buyer ? await hasBundlePurchase(b.id, buyer.id, buyer.email) : false;
  void incrementBundleView(b.id);

  const razorpayAvailable = isRazorpayConfigured();
  const upiAvailable = settings.upiFallbackEnabled && Boolean(settings.upiId);
  const savings = Math.max(0, b.originalTotalPaise - b.pricePaise);
  const savingsPct = b.originalTotalPaise > 0 ? Math.round((savings / b.originalTotalPaise) * 100) : 0;

  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Exam Prep", path: "/exam-prep" },
    { name: b.title, path: `/exam-prep/${b.slug}` },
  ];

  return (
    <div className="container py-8">
      <JsonLd
        data={[
          bundleJsonLd({
            title: b.title,
            description: b.excerpt || b.metaDescription || b.title,
            slug: b.slug,
            image: b.coverImage || b.previewImages[0],
            pricePaise: b.pricePaise,
          }),
          breadcrumbJsonLd(crumbs),
        ]}
      />
      <Breadcrumbs items={crumbs} />

      <div className="mt-4 grid gap-8 lg:grid-cols-3">
        <article className="lg:col-span-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">
              <Package className="mr-1 h-3 w-3" /> Bundle
            </Badge>
            {b.examType && <Badge variant="accent">{b.examType}</Badge>}
          </div>
          <h1 className="mt-3 text-2xl font-bold sm:text-3xl">{b.title}</h1>
          {b.excerpt && <p className="mt-2 text-muted-foreground">{b.excerpt}</p>}

          {b.previewImages.length > 0 && (
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {b.previewImages.map((url) => (
                <div key={url} className="relative aspect-[3/4] overflow-hidden rounded-lg border bg-muted">
                  <Image src={url} alt={`${b.title} preview`} fill className="object-cover" sizes="200px" unoptimized />
                </div>
              ))}
            </div>
          )}

          <div className="prose-sm mt-6 max-w-none">
            <Markdown content={b.description} />
          </div>

          {/* Contents */}
          <section className="mt-8 border-t pt-6">
            <h2 className="mb-4 text-xl font-bold">What's included ({b.resources.length})</h2>
            <ul className="space-y-2">
              {b.resources.map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-3 rounded-lg border p-3">
                  <div className="min-w-0">
                    <Link href={`/store/${r.slug}`} className="block truncate font-medium hover:underline">
                      {r.title}
                    </Link>
                    <span className="text-xs text-muted-foreground">
                      {RESOURCE_TYPE_LABELS[r.type]}
                      {r.access !== "FREE" ? ` · ${formatINR(r.pricePaise)} value` : " · Free"}
                    </span>
                  </div>
                  {owned ? (
                    <Button asChild size="sm" variant="outline">
                      <a href={`/api/resources/${r.slug}/download`}>
                        <Download className="h-4 w-4" /> Download
                      </a>
                    </Button>
                  ) : (
                    <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                  )}
                </li>
              ))}
            </ul>
          </section>
        </article>

        {/* Sidebar */}
        <aside className="space-y-4">
          <Card>
            <CardContent className="space-y-4 p-5">
              <div className="text-center">
                <p className="text-2xl font-bold">{formatINR(b.pricePaise)}</p>
                {savings > 0 && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    <span className="line-through">{formatINR(b.originalTotalPaise)}</span>{" "}
                    <span className="font-medium text-primary">save {savingsPct}%</span>
                  </p>
                )}
              </div>

              {owned ? (
                <div className="rounded-md border bg-accent/40 p-3 text-center text-sm">
                  <Check className="mx-auto mb-1 h-5 w-5 text-primary" />
                  You own this bundle — download any item above.
                  <Button asChild variant="link" className="mt-1">
                    <Link href="/account">Go to my account</Link>
                  </Button>
                </div>
              ) : (
                <ResourcePurchaseForm
                  slug={b.slug}
                  pricePaise={b.pricePaise}
                  razorpayAvailable={razorpayAvailable}
                  upiAvailable={upiAvailable}
                  defaultName={buyer?.name ?? ""}
                  defaultEmail={buyer?.email ?? ""}
                  purchaseUrl={`/api/bundles/${b.slug}/purchase`}
                  verifyUrl="/api/bundles/purchase/verify"
                  manualUrl="/api/bundles/purchase/manual"
                  buyLabel="Buy bundle"
                />
              )}

              <p className="border-t pt-3 text-center text-xs text-muted-foreground">
                {b.resources.length} resources · lifetime access · re-download anytime from your account
              </p>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
