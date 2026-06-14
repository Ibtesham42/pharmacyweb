import { Briefcase } from "lucide-react";
import { searchPosts } from "@/services/search";
import { searchSchema } from "@/lib/validation";
import { getLocations } from "@/services/settings";
import { PostCard } from "@/components/public/post-card";
import { JobFilters } from "@/components/public/job-filters";
import { Pagination } from "@/components/public/pagination";
import { EmptyState } from "@/components/public/empty-state";
import { Breadcrumbs } from "@/components/public/breadcrumbs";
import { AdSlot } from "@/components/ads/ad-slot";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Pharmacy & Medical Jobs in India",
  path: "/jobs",
  description:
    "Browse the latest pharmacy, medical and healthcare jobs across India. Filter by state, city and job type. Government and private openings.",
});

type SP = Record<string, string | undefined>;

export default async function JobsPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const parsed = searchSchema.safeParse({ ...sp, type: "JOB" });
  const input = parsed.success ? parsed.data : searchSchema.parse({ type: "JOB" });

  const [result, locations] = await Promise.all([searchPosts(input), getLocations()]);

  const buildHref = (page: number) => {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(sp)) if (v && k !== "page") params.set(k, v);
    params.set("page", String(page));
    return `/jobs?${params.toString()}`;
  };

  return (
    <div className="container py-8">
      <Breadcrumbs items={[{ name: "Home", path: "/" }, { name: "Jobs", path: "/jobs" }]} />

      <header className="mb-6 mt-3">
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight sm:text-3xl">
          <Briefcase className="h-7 w-7 text-primary" /> Pharmacy & Medical Jobs
        </h1>
        <p className="mt-1 text-muted-foreground">
          {result.total} {result.total === 1 ? "opening" : "openings"} across India
        </p>
      </header>

      <div className="mb-6">
        <JobFilters states={locations.states} />
      </div>

      <AdSlot slot="JOB_PAGE" />

      {result.items.length === 0 ? (
        <EmptyState title="No jobs found" description="Try clearing filters or searching different keywords." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {result.items.map((p) => (
            <PostCard key={p.id} post={p} />
          ))}
        </div>
      )}

      <Pagination page={result.page} pages={result.pages} buildHref={buildHref} />
    </div>
  );
}
