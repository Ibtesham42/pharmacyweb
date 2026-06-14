import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { Building2, MapPin, Briefcase, GraduationCap, CalendarClock, Globe } from "lucide-react";
import { getPublishedPostBySlug, getRelated, incrementViewCount } from "@/services/posts";
import { Markdown } from "@/components/markdown";
import { Breadcrumbs } from "@/components/public/breadcrumbs";
import { ApplyButton } from "@/components/public/apply-button";
import { ShareButtons } from "@/components/public/share-buttons";
import { PostCard } from "@/components/public/post-card";
import { AdSlot } from "@/components/ads/ad-slot";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { JsonLd } from "@/components/seo/json-ld";
import { buildMetadata, jobPostingJsonLd, breadcrumbJsonLd } from "@/lib/seo";
import { formatSalary, jobLocation, JOB_TYPE_LABELS, formatDate } from "@/lib/format";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPublishedPostBySlug(slug);
  if (!post || post.type !== "JOB") return { title: "Job not found" };
  return buildMetadata({
    title: post.seo?.metaTitle || post.title,
    description: post.seo?.metaDescription || post.excerpt || undefined,
    path: `/jobs/${post.slug}`,
    image: post.seo?.ogImageUrl || post.featuredImage?.url,
    type: "article",
    noindex: post.seo?.noindex,
    publishedTime: post.publishedAt,
    modifiedTime: post.updatedAt,
    keywords: post.seo?.keywords,
  });
}

export default async function JobDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPublishedPostBySlug(slug);
  if (!post || post.type !== "JOB" || !post.jobDetail) notFound();

  void incrementViewCount(post.id);
  const related = await getRelated(post, 3);
  const j = post.jobDetail;

  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Jobs", path: "/jobs" },
    { name: post.title, path: `/jobs/${post.slug}` },
  ];

  return (
    <div className="container py-8">
      <JsonLd
        data={[
          jobPostingJsonLd({
            title: post.title,
            description: post.excerpt || post.title,
            slug: post.slug,
            publishedAt: post.publishedAt,
            job: { ...j },
          }),
          breadcrumbJsonLd(crumbs),
        ]}
      />

      <Breadcrumbs items={crumbs} />

      <div className="mt-4 grid gap-8 lg:grid-cols-3">
        <article className="lg:col-span-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{JOB_TYPE_LABELS[j.jobType]}</Badge>
            {post.category && <Badge variant="accent">{post.category.name}</Badge>}
          </div>
          <h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">{post.title}</h1>
          <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Building2 className="h-4 w-4" /> {j.companyName}
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4" /> {jobLocation(j.city, j.state)}
            </span>
          </p>

          <div className="my-6">
            <ApplyButton url={j.applyUrl} postId={post.id} />
          </div>

          <Markdown content={post.content} />

          {post.tags.length > 0 && (
            <div className="mt-8 flex flex-wrap gap-2">
              {post.tags.map(({ tag }) => (
                <Link key={tag.id} href={`/search?q=${encodeURIComponent(tag.name)}`}>
                  <Badge variant="outline">#{tag.name}</Badge>
                </Link>
              ))}
            </div>
          )}

          <div className="mt-8 border-t pt-6">
            <ShareButtons path={`/jobs/${post.slug}`} title={post.title} />
          </div>
        </article>

        <aside className="space-y-6">
          <Card>
            <CardContent className="space-y-3 p-5 text-sm">
              <h2 className="text-base font-semibold">Job overview</h2>
              <Detail icon={Briefcase} label="Job type" value={JOB_TYPE_LABELS[j.jobType]} />
              <Detail icon={MapPin} label="Location" value={jobLocation(j.city, j.state)} />
              {formatSalary(j.salaryMin, j.salaryMax, j.salaryText) && (
                <Detail icon={Briefcase} label="Salary" value={formatSalary(j.salaryMin, j.salaryMax, j.salaryText)!} />
              )}
              {j.experienceLevel && <Detail icon={GraduationCap} label="Experience" value={j.experienceLevel} />}
              {j.qualifications && <Detail icon={GraduationCap} label="Qualification" value={j.qualifications} />}
              {j.expiryDate && <Detail icon={CalendarClock} label="Apply before" value={formatDate(j.expiryDate)} />}
              {j.companyWebsite && (
                <a
                  href={j.companyWebsite}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-primary hover:underline"
                >
                  <Globe className="h-4 w-4" /> Company website
                </a>
              )}
              <div className="pt-2">
                <ApplyButton url={j.applyUrl} postId={post.id} />
              </div>
            </CardContent>
          </Card>
          <AdSlot slot="SIDEBAR" className="my-0" />
        </aside>
      </div>

      {related.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-4 text-xl font-bold">Related jobs</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((p) => (
              <PostCard key={p.id} post={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function Detail({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      <div>
        <span className="text-muted-foreground">{label}: </span>
        <span className="font-medium">{value}</span>
      </div>
    </div>
  );
}
