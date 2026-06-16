import Link from "next/link";
import { ArrowRight, Briefcase, Newspaper, BookOpen, Tag } from "lucide-react";
import { getFeatured, getLatest } from "@/services/posts";
import { listPublicCategories } from "@/services/categories";
import { getHomepage } from "@/services/settings";
import { getDonationSettings, getPublicFeaturedSupporters } from "@/services/donations";
import { DEFAULT_DONATION_SETTINGS } from "@/lib/donations/config";
import { DonateCta } from "@/components/public/donate-cta";
import { FeaturedSupporters } from "@/components/public/featured-supporters";
import { SearchBar } from "@/components/public/search-bar";
import { PostCard } from "@/components/public/post-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AdSlot } from "@/components/ads/ad-slot";
import { buildMetadata } from "@/lib/seo";
import { safe } from "@/lib/utils";

export const revalidate = 300;

export const metadata = buildMetadata({
  path: "/",
  description:
    "Discover pharmacy jobs, medical jobs, government healthcare vacancies, medical news and study material across India.",
});

function SectionHeader({
  icon: Icon,
  title,
  href,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  href: string;
}) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <h2 className="flex items-center gap-2 text-xl font-bold tracking-tight sm:text-2xl">
        <Icon className="h-5 w-5 text-primary" /> {title}
      </h2>
      <Link href={href} className="flex items-center gap-1 text-sm font-medium text-primary hover:underline">
        View all <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}

export default async function HomePage() {
  const [home, featured, jobs, articles, news, categories, donations] = await Promise.all([
    safe(getHomepage(), {
      heroTitle: "Find Your Next Pharmacy & Medical Career",
      heroSubtitle:
        "Government and private pharmacist, medical representative, and healthcare jobs across India.",
      featuredCount: 6,
    }),
    safe(getFeatured(6), []),
    safe(getLatest("JOB", 6), []),
    safe(getLatest("ARTICLE", 3), []),
    safe(getLatest("NEWS", 3), []),
    safe(listPublicCategories(), []),
    safe(getDonationSettings(), DEFAULT_DONATION_SETTINGS),
  ]);
  const supporters =
    donations.featuredEnabled && donations.featuredOnHomepage
      ? await safe(
          getPublicFeaturedSupporters({
            limit: donations.featuredMaxShow,
            thresholds: donations.badgeThresholds,
          }),
          [],
        )
      : [];

  return (
    <>
      {/* Hero */}
      <section className="border-b bg-gradient-to-b from-accent/60 to-background">
        <div className="container py-12 text-center sm:py-16">
          <h1 className="mx-auto max-w-3xl text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl">
            {home.heroTitle}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
            {home.heroSubtitle}
          </p>
          <div className="mx-auto mt-8 max-w-2xl">
            <SearchBar />
          </div>
          {categories.length > 0 && (
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {categories.slice(0, 6).map((c) => (
                <Link key={c.id} href={`/categories/${c.slug}`}>
                  <Badge variant="outline" className="px-3 py-1 text-sm hover:bg-accent">
                    {c.name}
                  </Badge>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <div className="container py-10">
        <AdSlot slot="HOMEPAGE_TOP" />

        {featured.length > 0 && (
          <section className="mb-12">
            <SectionHeader icon={Briefcase} title="Featured" href="/jobs" />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {featured.map((p) => (
                <PostCard key={p.id} post={p} />
              ))}
            </div>
          </section>
        )}

        {jobs.length > 0 && (
          <section className="mb-12">
            <SectionHeader icon={Briefcase} title="Latest Jobs" href="/jobs" />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {jobs.map((p) => (
                <PostCard key={p.id} post={p} />
              ))}
            </div>
          </section>
        )}

        {donations.enabled && (
          <section className="mb-12">
            <DonateCta source="homepage" />
          </section>
        )}

        {supporters.length > 0 && (
          <section className="mb-12">
            <FeaturedSupporters supporters={supporters} />
          </section>
        )}

        <AdSlot slot="BETWEEN_CONTENT" />

        {articles.length > 0 && (
          <section className="mb-12">
            <SectionHeader icon={BookOpen} title="Articles & Guides" href="/articles" />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {articles.map((p) => (
                <PostCard key={p.id} post={p} />
              ))}
            </div>
          </section>
        )}

        {news.length > 0 && (
          <section className="mb-12">
            <SectionHeader icon={Newspaper} title="Medical News" href="/news" />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {news.map((p) => (
                <PostCard key={p.id} post={p} />
              ))}
            </div>
          </section>
        )}

        {categories.length > 0 && (
          <section className="mb-4">
            <SectionHeader icon={Tag} title="Browse by Category" href="/categories" />
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {categories.map((c) => (
                <Link
                  key={c.id}
                  href={`/categories/${c.slug}`}
                  className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:border-primary hover:bg-accent/50"
                >
                  <span className="font-medium">{c.name}</span>
                  <Badge variant="secondary">{c._count.posts}</Badge>
                </Link>
              ))}
            </div>
          </section>
        )}

        {featured.length === 0 && jobs.length === 0 && (
          <div className="rounded-xl border border-dashed py-16 text-center">
            <p className="text-muted-foreground">No content yet. Sign in to the admin to publish your first post.</p>
            <Button asChild className="mt-4">
              <Link href="/admin">Go to Admin</Link>
            </Button>
          </div>
        )}
      </div>
    </>
  );
}
