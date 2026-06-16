import { cache } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { Download, FileText, Star, Tag as TagIcon, Lock } from "lucide-react";
import { ResourceAccess } from "@prisma/client";
import { getResourceBySlug, hasEntitlement, hasDownloaded } from "@/services/resources";
import { listApprovedReviews, getBuyerReview } from "@/services/resource-reviews";
import { isBookmarked } from "@/services/resource-bookmarks";
import { getMarketplaceSettings } from "@/services/marketplace-settings";
import { getCurrentBuyer } from "@/lib/buyer-session";
import { isRazorpayConfigured } from "@/lib/razorpay";
import { Breadcrumbs } from "@/components/public/breadcrumbs";
import { Markdown } from "@/components/markdown";
import { JsonLd } from "@/components/seo/json-ld";
import { RatingStars } from "@/components/public/rating-stars";
import { ReviewForm } from "@/components/public/review-form";
import { BookmarkButton } from "@/components/public/bookmark-button";
import { ResourcePurchaseForm } from "@/components/public/resource-purchase-form";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatINR, formatDate } from "@/lib/format";
import { RESOURCE_TYPE_LABELS, avgRating, formatBytes } from "@/lib/marketplace/config";
import { buildMetadata, resourceJsonLd, breadcrumbJsonLd } from "@/lib/seo";

export const dynamic = "force-dynamic";

const getResource = cache((slug: string) => getResourceBySlug(slug));

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const r = await getResource(slug);
  if (!r) return { title: "Resource not found" };
  return buildMetadata({
    title: r.metaTitle || r.title,
    description: r.metaDescription || r.excerpt || undefined,
    path: `/store/${r.slug}`,
    image: r.ogImageUrl || r.previewImages[0],
    type: "article",
    publishedTime: r.publishedAt,
    modifiedTime: r.updatedAt,
  });
}

export default async function ResourceDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const r = await getResource(slug);
  if (!r) notFound();

  const [settings, buyer] = await Promise.all([getMarketplaceSettings(), getCurrentBuyer()]);
  const [reviews, entitled, bookmarked, myReview, downloaded] = await Promise.all([
    listApprovedReviews(r.id),
    buyer ? hasEntitlement({ resourceId: r.id, access: r.access, buyerId: buyer.id, email: buyer.email }) : Promise.resolve(r.access === ResourceAccess.FREE),
    buyer ? isBookmarked(buyer.id, r.id) : Promise.resolve(false),
    buyer ? getBuyerReview(r.id, buyer.id) : Promise.resolve(null),
    buyer ? hasDownloaded(r.id, buyer.id, buyer.email) : Promise.resolve(false),
  ]);

  const rating = avgRating(r.ratingSum, r.ratingCount);
  const razorpayAvailable = isRazorpayConfigured();
  const upiAvailable = settings.upiFallbackEnabled && Boolean(settings.upiId);
  const canReview =
    Boolean(buyer) && (r.access === ResourceAccess.PAID ? entitled : r.access === ResourceAccess.FREE && downloaded);

  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Store", path: "/store" },
    { name: r.title, path: `/store/${r.slug}` },
  ];

  return (
    <div className="container py-8">
      <JsonLd
        data={[
          resourceJsonLd({
            title: r.title,
            description: r.excerpt || r.metaDescription || r.title,
            slug: r.slug,
            image: r.previewImages[0],
            pricePaise: r.pricePaise,
            isFree: r.access === ResourceAccess.FREE,
            ratingValue: rating,
            ratingCount: r.ratingCount,
          }),
          breadcrumbJsonLd(crumbs),
        ]}
      />
      <Breadcrumbs items={crumbs} />

      <div className="mt-4 grid gap-8 lg:grid-cols-3">
        <article className="lg:col-span-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{RESOURCE_TYPE_LABELS[r.type]}</Badge>
            {r.category && (
              <Link href={`/store?category=${r.category.slug}`}>
                <Badge variant="accent">{r.category.name}</Badge>
              </Link>
            )}
          </div>
          <h1 className="mt-3 text-2xl font-bold sm:text-3xl">{r.title}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            {r.author && <span>By {r.author}</span>}
            {r.ratingCount > 0 && (
              <span className="flex items-center gap-1">
                <RatingStars value={rating} size={14} /> {rating} ({r.ratingCount})
              </span>
            )}
            <span className="flex items-center gap-1">
              <Download className="h-3.5 w-3.5" /> {r.downloadCount} downloads
            </span>
            <span>{formatDate(r.publishedAt)}</span>
          </div>

          {r.previewImages.length > 0 && (
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {r.previewImages.map((url) => (
                <div key={url} className="relative aspect-[3/4] overflow-hidden rounded-lg border bg-muted">
                  <Image src={url} alt={`${r.title} preview`} fill className="object-cover" sizes="200px" unoptimized />
                </div>
              ))}
            </div>
          )}

          {r.abstract && (
            <div className="mt-6 rounded-lg border bg-muted/30 p-4">
              <h2 className="text-sm font-semibold">Abstract</h2>
              <p className="mt-1 text-sm text-muted-foreground">{r.abstract}</p>
              {r.citation && <p className="mt-2 text-xs text-muted-foreground">Cite as: {r.citation}</p>}
            </div>
          )}

          <div className="prose-sm mt-6 max-w-none">
            <Markdown content={r.description} />
          </div>

          {r.tags.length > 0 && (
            <div className="mt-8 flex flex-wrap gap-2">
              {r.tags.map(({ tag }) => (
                <Badge key={tag.slug} variant="outline">
                  <TagIcon className="mr-1 h-3 w-3" /> {tag.name}
                </Badge>
              ))}
            </div>
          )}

          {/* Reviews */}
          <section className="mt-10 border-t pt-6">
            <h2 className="mb-4 text-xl font-bold">Reviews</h2>
            {canReview && (
              <div className="mb-5">
                <ReviewForm slug={r.slug} initial={myReview ?? undefined} />
              </div>
            )}
            {reviews.length === 0 ? (
              <p className="text-sm text-muted-foreground">No reviews yet.</p>
            ) : (
              <div className="space-y-4">
                {reviews.map((rev) => (
                  <div key={rev.id} className="rounded-lg border p-4">
                    <div className="flex items-center justify-between">
                      <RatingStars value={rev.rating} size={14} />
                      <span className="text-xs text-muted-foreground">{formatDate(rev.createdAt)}</span>
                    </div>
                    {rev.title && <p className="mt-1 font-medium">{rev.title}</p>}
                    {rev.body && <p className="text-sm text-muted-foreground">{rev.body}</p>}
                    <p className="mt-1 text-xs text-muted-foreground">— {rev.buyer.name || "Verified buyer"}</p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </article>

        {/* Sidebar */}
        <aside className="space-y-4">
          <Card>
            <CardContent className="space-y-4 p-5">
              <div className="text-center">
                {r.access === "FREE" ? (
                  <p className="text-2xl font-bold text-primary">Free</p>
                ) : r.access === "PAID" ? (
                  <p className="text-2xl font-bold">{formatINR(r.pricePaise)}</p>
                ) : (
                  <p className="text-lg font-semibold">Members only</p>
                )}
              </div>

              {r.access === ResourceAccess.PREMIUM ? (
                <div className="rounded-md border bg-muted/40 p-3 text-center text-sm text-muted-foreground">
                  <Lock className="mx-auto mb-1 h-5 w-5" />
                  Premium memberships are coming soon.
                </div>
              ) : entitled ? (
                <Button asChild className="w-full">
                  <a href={`/api/resources/${r.slug}/download`}>
                    <Download className="h-4 w-4" /> Download
                  </a>
                </Button>
              ) : (
                <ResourcePurchaseForm
                  slug={r.slug}
                  pricePaise={r.pricePaise}
                  razorpayAvailable={razorpayAvailable}
                  upiAvailable={upiAvailable}
                  defaultName={buyer?.name ?? ""}
                  defaultEmail={buyer?.email ?? ""}
                />
              )}

              <BookmarkButton slug={r.slug} initialBookmarked={bookmarked} signedIn={Boolean(buyer)} />

              <dl className="space-y-2 border-t pt-3 text-sm">
                {r.fileType && <Meta icon={FileText} label="Format" value={r.fileType} />}
                {r.fileSizeBytes ? <Meta icon={Download} label="Size" value={formatBytes(r.fileSizeBytes)} /> : null}
                {r.pageCount ? <Meta icon={FileText} label="Pages" value={String(r.pageCount)} /> : null}
                {r.ratingCount > 0 && <Meta icon={Star} label="Rating" value={`${rating} / 5`} />}
              </dl>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}

function Meta({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <span className="text-muted-foreground">{label}:</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
