import Link from "next/link";
import { searchPosts } from "@/services/search";
import { searchSchema } from "@/lib/validation";
import { recordEvent } from "@/services/analytics";
import { SearchBar } from "@/components/public/search-bar";
import { PostCard } from "@/components/public/post-card";
import { Pagination } from "@/components/public/pagination";
import { EmptyState } from "@/components/public/empty-state";
import { Breadcrumbs } from "@/components/public/breadcrumbs";
import { AdSlot } from "@/components/ads/ad-slot";
import { cn } from "@/lib/utils";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Search",
  path: "/search",
  description: "Search pharmacy jobs, medical news and articles.",
});

const TYPE_TABS = [
  { value: "", label: "All" },
  { value: "JOB", label: "Jobs" },
  { value: "ARTICLE", label: "Articles" },
  { value: "NEWS", label: "News" },
];

type SP = Record<string, string | undefined>;

export default async function SearchPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const parsed = searchSchema.safeParse(sp);
  const input = parsed.success ? parsed.data : searchSchema.parse({});

  const result = await searchPosts(input);
  if (input.q) void recordEvent({ type: "SEARCH", query: input.q, path: "/search" });

  const activeType = sp.type ?? "";
  const tabHref = (type: string) => {
    const params = new URLSearchParams();
    if (input.q) params.set("q", input.q);
    if (type) params.set("type", type);
    return `/search?${params.toString()}`;
  };
  const buildHref = (page: number) => {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(sp)) if (v && k !== "page") params.set(k, v);
    params.set("page", String(page));
    return `/search?${params.toString()}`;
  };

  return (
    <div className="container py-8">
      <Breadcrumbs items={[{ name: "Home", path: "/" }, { name: "Search", path: "/search" }]} />

      <header className="mb-6 mt-3">
        <h1 className="mb-4 text-2xl font-bold tracking-tight sm:text-3xl">Search</h1>
        <SearchBar defaultValue={input.q} />
      </header>

      <div className="mb-6 flex flex-wrap gap-2">
        {TYPE_TABS.map((t) => (
          <Link
            key={t.value}
            href={tabHref(t.value)}
            className={cn(
              "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors hover:bg-accent",
              activeType === t.value && "border-primary bg-primary text-primary-foreground hover:bg-primary",
            )}
          >
            {t.label}
          </Link>
        ))}
      </div>

      <AdSlot slot="HOMEPAGE_TOP" />

      <p className="mb-4 text-sm text-muted-foreground">
        {input.q ? (
          <>
            {result.total} result{result.total === 1 ? "" : "s"} for{" "}
            <span className="font-medium text-foreground">“{input.q}”</span>
          </>
        ) : (
          `${result.total} results`
        )}
      </p>

      {result.items.length === 0 ? (
        <EmptyState
          title="No results"
          description="Try different keywords, or browse jobs and articles from the menu."
        />
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
